import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { and, desc, eq, gt, lt, not } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db/index.ts";
import {
  academicSessions,
  hallAdmins,
  refreshTokens,
  uniStudents,
} from "../../db/models/index.ts";
import { type OperationalUnit } from "../../types/enums.ts";
import ApiError from "../../utils/ApiError.ts";
import ApiResponse from "../../utils/ApiResponse.ts";
import { hashToken } from "../../utils/helpers.ts";
import type { AccessTokenPayload, RefreshTokenPayload } from "./auth.d.ts";
import {
  clearAuthCookies,
  issueAuthTokenAndSetCookies,
  revokeAllUserTokens,
  rotateRefreshTokenRecord,
  setAuthCookies,
  verifyRefreshToken,
} from "./auth.service.ts";

const MAX_ACTIVE_SESSIONS_PER_USER = 2;

/** Remove expired refresh-token rows so they never count toward the limit. */
async function pruneExpiredRefreshTokens(userId: string): Promise<void> {
  await db
    .delete(refreshTokens)
    .where(
      and(
        eq(refreshTokens.userId, userId),
        lt(refreshTokens.expiresAt, new Date())
      )
    );
}

/** Count non-expired refresh sessions for a user. */
async function countActiveSessions(userId: string): Promise<number> {
  const active = await db
    .select({ id: refreshTokens.id })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.userId, userId),
        gt(refreshTokens.expiresAt, new Date())
      )
    );
  return active.length;
}

/**
 * Enforce the per-user session cap before issuing a new refresh token.
 * - At limit and `force` is false → 403 (block 3rd login).
 * - At limit and `force` is true  → revoke all sessions, then caller
 *   may issue a fresh one (recovery after cookie clears / lost devices).
 */
async function enforceSessionLimitOrThrow(
  userId: string,
  force?: boolean
): Promise<void> {
  await pruneExpiredRefreshTokens(userId);

  const activeCount = await countActiveSessions(userId);
  if (activeCount < MAX_ACTIVE_SESSIONS_PER_USER) {
    return;
  }

  if (force) {
    await revokeAllUserTokens(userId);
    return;
  }

  throw new ApiError(
    403,
    "Maximum active sessions reached (2 devices). Log out on another device, wait for sessions to expire, or sign in again and choose to end all other sessions."
  );
}

/**
 * POST /api/v1/auth/register
 * Register a new student account
 */
export const studentRegister = async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    rollNumber,
    academicDepartment,
    session,
    phone,
  } = req.body;

  const [existingUser] = await db
    .select()
    .from(uniStudents)
    .where(eq(uniStudents.email, email))
    .limit(1);

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const [validSession] = await db
    .select({ id: academicSessions.id })
    .from(academicSessions)
    .where(
      and(
        eq(academicSessions.label, session),
        eq(academicSessions.isActive, true)
      )
    )
    .limit(1);

  if (!validSession) {
    throw new ApiError(400, "Please select a valid active session");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = randomUUID();

  await db.insert(uniStudents).values({
    id: userId,
    email,
    passwordHash,
    name,
    phone,
    rollNumber: String(rollNumber),
    academicDepartment,
    session,
    isAllocated: false,
  });

  const [newUser] = await db
    .select()
    .from(uniStudents)
    .where(eq(uniStudents.email, email))
    .limit(1);

  if (!newUser) {
    throw new ApiError(500, "Failed to create user");
  }

  const tokenPayload: AccessTokenPayload = {
    userId: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: "STUDENT",
  };

  return (
    await issueAuthTokenAndSetCookies({
      req,
      res,
      tokenPayload,
    })
  ).json(
    new ApiResponse(
      201,
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      "User registered successfully"
    )
  );
};

/**
 * GET /api/v1/auth/sessions
 * Public endpoint to retrieve active sessions for student signup
 */
export const getActiveAcademicSessions = async (
  _req: Request,
  res: Response
) => {
  const sessions = await db
    .select({
      id: academicSessions.id,
      label: academicSessions.label,
    })
    .from(academicSessions)
    .where(eq(academicSessions.isActive, true))
    .orderBy(desc(academicSessions.createdAt));

  res
    .status(200)
    .json(
      new ApiResponse(200, { sessions }, "Sessions retrieved successfully")
    );
};

/**
 * GET /api/v1/auth/sessions/manage
 * Admin endpoint to retrieve all sessions for management
 */
export const getAllAcademicSessions = async (_req: Request, res: Response) => {
  const sessions = await db
    .select({
      id: academicSessions.id,
      label: academicSessions.label,
      isActive: academicSessions.isActive,
      createdByAdminId: academicSessions.createdByAdminId,
      createdAt: academicSessions.createdAt,
      updatedAt: academicSessions.updatedAt,
    })
    .from(academicSessions)
    .orderBy(desc(academicSessions.createdAt));

  res
    .status(200)
    .json(
      new ApiResponse(200, { sessions }, "Sessions retrieved successfully")
    );
};

/**
 * POST /api/v1/auth/sessions
 * Create a new academic session (allowed for non-dining admins)
 */
export const createAcademicSession = async (req: Request, res: Response) => {
  const admin =
    req.authAccount?.kind === "ADMIN" ? req.authAccount.admin : null;
  if (!admin) {
    throw new ApiError(401, "Admin authentication required");
  }

  const { label } = req.body;
  const normalizedLabel = String(label).trim();

  const [existing] = await db
    .select({ id: academicSessions.id })
    .from(academicSessions)
    .where(eq(academicSessions.label, normalizedLabel))
    .limit(1);

  if (existing) {
    throw new ApiError(409, "This session already exists");
  }

  const sessionId = randomUUID();
  await db.insert(academicSessions).values({
    id: sessionId,
    label: normalizedLabel,
    createdByAdminId: admin.id,
    isActive: true,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id: sessionId,
        label: normalizedLabel,
        isActive: true,
      },
      "Session created successfully"
    )
  );
};

/**
 * PATCH /api/v1/auth/sessions/:sessionId
 * Update academic session label/active status (allowed for non-dining admins)
 */
export const updateAcademicSession = async (req: Request, res: Response) => {
  const { sessionId } = req.params as { sessionId: string };
  const { label, isActive } = req.body;

  const [existing] = await db
    .select({ id: academicSessions.id, label: academicSessions.label })
    .from(academicSessions)
    .where(eq(academicSessions.id, sessionId))
    .limit(1);

  if (!existing) {
    throw new ApiError(404, "Session not found");
  }

  const updateData: { label?: string; isActive?: boolean } = {};

  if (label !== undefined) {
    const normalizedLabel = String(label).trim();
    const [duplicate] = await db
      .select({ id: academicSessions.id })
      .from(academicSessions)
      .where(
        and(
          eq(academicSessions.label, normalizedLabel),
          not(eq(academicSessions.id, sessionId))
        )
      )
      .limit(1);

    if (duplicate) {
      throw new ApiError(409, "Another session already uses this label");
    }

    updateData.label = normalizedLabel;
  }

  if (isActive !== undefined) {
    updateData.isActive = Boolean(isActive);
  }

  await db
    .update(academicSessions)
    .set(updateData)
    .where(eq(academicSessions.id, sessionId));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        id: sessionId,
        ...updateData,
      },
      "Session updated successfully"
    )
  );
};

/**
 * POST /api/v1/auth/login
 * Login a student with email and password
 */
export const studentLogin = async (req: Request, res: Response) => {
  const { email, password, force } = req.body;

  const [user] = await db
    .select()
    .from(uniStudents)
    .where(eq(uniStudents.email, email))
    .limit(1);

  if (!user) {
    throw new ApiError(401, "No user found with this email");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  if (!user.isActive || user.status !== "ACTIVE") {
    throw new ApiError(
      403,
      `Account is ${user.status.toLowerCase()}. Please contact administration.`
    );
  }

  const tokenPayload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: "STUDENT",
  };

  await enforceSessionLimitOrThrow(user.id, force);

  return (
    await issueAuthTokenAndSetCookies({
      req,
      res,
      tokenPayload,
    })
  ).json(
    new ApiResponse(
      200,
      {
        student_data: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          academicDepartment: user.academicDepartment,
          rollNumber: user.rollNumber,
          session: user.session,
          hall: user.hall,
          roomId: user.roomId,
          status: user.status,
          isAllocated: user.isAllocated,
        },
      },
      "User logged in successfully"
    )
  );
};

/**
 * POST /api/v1/auth/admin/register
 * Register a new admin account with hall assignment
 */
export const adminRegister = async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    academicDepartment,
    hall,
    designation,
    phone,
  } = req.body;

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await db.transaction(async (tx) => {
    // Check if user already exists
    const [existingUser] = await tx
      .select()
      .from(hallAdmins)
      .where(eq(hallAdmins.email, email))
      .limit(1);

    let operationalUnit: OperationalUnit;

    // setting operational unit based on the designation
    if (
      designation === "INVENTORY_SECTION_OFFICER" ||
      designation === "ASST_INVENTORY"
    ) {
      operationalUnit = "INVENTORY";
    } else if (
      designation === "DINING_MANAGER" ||
      designation === "ASST_DINING"
    ) {
      operationalUnit = "DINING";
    } else if (
      designation === "FINANCE_SECTION_OFFICER" ||
      designation === "ASST_FINANCE"
    ) {
      operationalUnit = "FINANCE";
    } else {
      operationalUnit = "ALL"; // For PROVOST or any other unhandled roles
    }

    if (existingUser) {
      if (existingUser.hallAdminStatus !== "REJECTED") {
        throw new ApiError(409, "User with this email already exists");
      }

      // If REJECTED, update the existing row
      await tx
        .update(hallAdmins)
        .set({
          name,
          phone,
          passwordHash,
          academicDepartment: academicDepartment || null,
          hall,
          designation,
          operationalUnit,
          isActive: true,
          hallAdminStatus: "PENDING", // Reset status for re-approval
        })
        .where(eq(hallAdmins.id, existingUser.id));

      // Return updated user
      const [updatedUser] = await tx
        .select()
        .from(hallAdmins)
        .where(eq(hallAdmins.id, existingUser.id))
        .limit(1);

      return updatedUser;
    } else {
      // Create new user
      await tx.insert(hallAdmins).values({
        id: randomUUID(),
        email,
        passwordHash,
        name,
        phone,
        academicDepartment: academicDepartment || null,
        hall,
        designation,
        operationalUnit,
        isActive: true,
      });

      const [createdAdmin] = await tx
        .select()
        .from(hallAdmins)
        .where(eq(hallAdmins.email, email))
        .limit(1);

      return createdAdmin;
    }
  });

  if (!newUser) {
    throw new ApiError(500, "Failed to create or update user");
  }

  const tokenPayload: AccessTokenPayload = {
    userId: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.designation,
  };

  res.status(201).json(
    new ApiResponse(
      201,
      {
        user: tokenPayload,
      },
      "Admin registration pending"
    )
  );
};

/**
 * POST /api/v1/auth/admin/approval
 * Update an admin application's approval status (provost only)
 */
export const adminApproval = async (req: Request, res: Response) => {
  const { adminApplicationId, status } = req.body;

  const admin =
    req.authAccount?.kind === "ADMIN" ? req.authAccount.admin : null;

  if (!admin || admin.designation !== "PROVOST") {
    throw new ApiError(403, "Only provosts can approve admin applications");
  }

  await db
    .update(hallAdmins)
    .set({ hallAdminStatus: status })
    .where(eq(hallAdmins.id, adminApplicationId));

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { adminApplicationId, status },
        "Admin approval status updated"
      )
    );
};

/**
 * GET /api/v1/auth/admin/applications
 * Retrieve pending admin applications (provost only)
 */
export const adminApplications = async (req: Request, res: Response) => {
  const admin =
    req.authAccount?.kind === "ADMIN" ? req.authAccount.admin : null;

  if (!admin || admin.designation !== "PROVOST") {
    throw new ApiError(403, "Only provosts can view admin applications");
  }

  const applications = await db
    .select()
    .from(hallAdmins)
    .where(
      and(
        eq(hallAdmins.hallAdminStatus, "PENDING"),
        eq(hallAdmins.hall, admin.hall)
      )
    );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { applications },
        "Admin applications retrieved successfully"
      )
    );
};

/**
 * POST /api/v1/auth/admin/login
 * Login an approved admin account
 */
export const adminLogin = async (req: Request, res: Response) => {
  const { email, password, force } = req.body;

  const [user] = await db
    .select()
    .from(hallAdmins)
    .where(eq(hallAdmins.email, email))
    .limit(1);

  if (!user) {
    throw new ApiError(401, "No user found with this email");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Admin account is deactivated");
  }

  if (user.hallAdminStatus !== "APPROVED") {
    throw new ApiError(
      403,
      `Application is ${user.hallAdminStatus.toLowerCase()}`
    );
  }

  const tokenPayload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.designation,
  };

  await enforceSessionLimitOrThrow(user.id, force);

  return (
    await issueAuthTokenAndSetCookies({
      req,
      res,
      tokenPayload,
    })
  ).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.designation,
          academicDepartment: user.academicDepartment,
          phone: user.phone,
          hall: user.hall,
          designation: user.designation,
          operationalUnit: user.operationalUnit,
          reportingToId: user.reportingToId,
          isActive: user.isActive,
        },
      },
      "Admin logged in successfully"
    )
  );
};

/**
 * POST /api/v1/auth/renew-access-token
 *
 * Validates the incoming refresh token and — on every successful renewal —
 * ROTATES it: new jti, new tokenHash, new expiry, new cookies. The old
 * refresh token is destroyed in place (same DB row, replaced contents) so
 * presenting it again triggers reuse detection.
 *
 * Failure modes always (a) clear both auth cookies on the response and
 * (b) return 401. This guarantees the frontend proxy/middleware can never
 * keep seeing a dead `refreshToken` cookie and loop the user.
 */
export const renewAccessToken = async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  if (!incomingRefreshToken) {
    clearAuthCookies(res);
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded: RefreshTokenPayload;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch {
    clearAuthCookies(res);
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const incomingHash = hashToken(incomingRefreshToken);

  // Exact-match lookup: same jti AND same tokenHash.
  const [tokenRecord] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.jti, decoded.jti),
        eq(refreshTokens.tokenHash, incomingHash)
      )
    )
    .limit(1);

  if (!tokenRecord) {
    // Signature was valid, so this JWT was issued by us. The hash mismatch
    // means EITHER (a) the row was rotated and the caller is replaying an
    // older refresh token, OR (b) the row was revoked. (a) implies a
    // potential leak of the old token — defensively revoke ALL sessions
    // for this user so a stolen token can never be replayed silently.
    const [conflict] = await db
      .select({ id: refreshTokens.id })
      .from(refreshTokens)
      .where(eq(refreshTokens.jti, decoded.jti))
      .limit(1);

    if (conflict) {
      await revokeAllUserTokens(decoded.userId);
    }

    clearAuthCookies(res);
    throw new ApiError(
      401,
      "Refresh token is no longer valid. Please log in again."
    );
  }

  if (tokenRecord.expiresAt < new Date()) {
    await db.delete(refreshTokens).where(eq(refreshTokens.id, tokenRecord.id));
    clearAuthCookies(res);
    throw new ApiError(401, "Refresh token has expired. Please log in again.");
  }

  // Re-fetch the user from the live DB so role / isActive / status changes
  // take effect at refresh time. The refresh payload only tells us which
  // table to look in.
  let tokenPayload: AccessTokenPayload;

  if (decoded.role === "STUDENT") {
    const [student] = await db
      .select()
      .from(uniStudents)
      .where(eq(uniStudents.id, decoded.userId))
      .limit(1);

    if (!student) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, tokenRecord.id));
      clearAuthCookies(res);
      throw new ApiError(401, "Account no longer exists.");
    }

    if (!student.isActive || student.status !== "ACTIVE") {
      await revokeAllUserTokens(student.id);
      clearAuthCookies(res);
      throw new ApiError(
        403,
        `Account is ${student.status.toLowerCase()}. Please contact administration.`
      );
    }

    tokenPayload = {
      userId: student.id,
      email: student.email,
      name: student.name,
      role: "STUDENT",
      rollNumber: student.rollNumber,
    };
  } else {
    const [admin] = await db
      .select()
      .from(hallAdmins)
      .where(eq(hallAdmins.id, decoded.userId))
      .limit(1);

    if (!admin) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, tokenRecord.id));
      clearAuthCookies(res);
      throw new ApiError(401, "Account no longer exists.");
    }

    if (!admin.isActive) {
      await revokeAllUserTokens(admin.id);
      clearAuthCookies(res);
      throw new ApiError(403, "Admin account is deactivated.");
    }

    if (admin.hallAdminStatus !== "APPROVED") {
      await revokeAllUserTokens(admin.id);
      clearAuthCookies(res);
      throw new ApiError(
        403,
        `Admin application is ${admin.hallAdminStatus.toLowerCase()}.`
      );
    }

    tokenPayload = {
      userId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.designation,
    };
  }

  const { accessToken, refreshToken } = await rotateRefreshTokenRecord({
    req,
    rowId: tokenRecord.id,
    tokenPayload,
  });

  return setAuthCookies(res, accessToken, refreshToken)
    .status(200)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
};

/**
 * POST /api/v1/auth/logout
 * Logout from current device only. Always clears cookies — even when the
 * refresh-token row is already gone — so the browser can't keep replaying
 * a stale cookie.
 */
export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    const hashedToken = hashToken(refreshToken);
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hashedToken));
  }

  return clearAuthCookies(res)
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
};

/**
 * POST /api/v1/auth/logout-all
 * Logout from all devices (invalidate every refresh token for this user).
 */
export const logoutAll = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  await revokeAllUserTokens(userId);

  return clearAuthCookies(res)
    .status(200)
    .json(
      new ApiResponse(200, null, "Logged out from all devices successfully")
    );
};

/* 
export const getActiveSessions = async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const sessions = await db
      .select({
        id: refreshTokens.id,
        ip: refreshTokens.ip,
        userAgent: refreshTokens.userAgent,
        createdAt: refreshTokens.createdAt,
        expiresAt: refreshTokens.expiresAt,
      })
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId))
      .orderBy(desc(refreshTokens.createdAt));

    return res
      .status(200)
      .json(new ApiResponse(200, { sessions }, "Active sessions retrieved"));
  }
;

export const revokeSession = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const sessionId = req.params.sessionId as string;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const [session] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(eq(refreshTokens.id, sessionId), eq(refreshTokens.userId, userId))
      )
      .limit(1);

    if (!session) {
      throw new ApiError(404, "Session not found");
    }

    await db.delete(refreshTokens).where(eq(refreshTokens.id, sessionId));

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Session revoked successfully"));
  }
;
 */
