import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db/index.ts";
import {
  hallAdmins,
  refreshTokens,
  uniStudents,
} from "../../db/models/index.ts";
import ApiError from "../../utils/ApiError.ts";
import ApiResponse from "../../utils/ApiResponse.ts";
import { hashToken } from "../../utils/helpers.ts";
import type { AccessTokenPayload, RefreshTokenPayload } from "./auth.d.ts";
import {
  issueAuthTokenAndSetCookies,
  options,
  signAccessToken,
  verifyRefreshToken,
} from "./auth.service.ts";

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
 * POST /api/v1/auth/login
 * Login a student with email and password
 */
export const studentLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

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

  const tokenPayload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: "STUDENT",
  };

  const activeTokens = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.userId, user.id))
    .orderBy(desc(refreshTokens.createdAt));

  if (activeTokens.length >= 2) {
    // const oldestToken = activeTokens.sort(
    //   (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    // )[0]!;

    // await db.delete(refreshTokens).where(eq(refreshTokens.id, oldestToken.id));
    throw new ApiError(
      403,
      "Maximum active sessions reached. Please logout from other devices."
    );
  }

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
    operationalUnit,
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

  const { userId } = req.user!;

  const [admin] = await db
    .select()
    .from(hallAdmins)
    .where(
      and(eq(hallAdmins.id, userId), eq(hallAdmins.designation, "PROVOST"))
    )
    .limit(1);

  if (!admin) {
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
  const { userId } = req.user!;
  const [admin] = await db
    .select()
    .from(hallAdmins)
    .where(
      and(eq(hallAdmins.id, userId), eq(hallAdmins.designation, "PROVOST"))
    )
    .limit(1);

  if (!admin) {
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
  const { email, password } = req.body;

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

  const activeTokens = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.userId, user.id))
    .orderBy(desc(refreshTokens.createdAt));

  if (activeTokens.length >= 2) {
    // const oldestToken = activeTokens.sort(
    //   (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    // )[0]!;

    // await db.delete(refreshTokens).where(eq(refreshTokens.id, oldestToken.id));
    throw new ApiError(
      403,
      "Maximum active sessions reached. Please logout from other devices."
    );
  }

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
 * Refresh access token using refresh token
 */
export const renewAccessToken = async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  let decoded: RefreshTokenPayload;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const tokenHash = hashToken(incomingRefreshToken);

  const [tokenRecord] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.jti, decoded.jti),
        eq(refreshTokens.tokenHash, tokenHash)
      )
    )
    .limit(1);

  if (!tokenRecord) {
    throw new ApiError(401, "Refresh token not found");
  }

  if (tokenRecord.expiresAt < new Date()) {
    throw new ApiError(401, "Refresh token has expired");
  }

  const tokenPayload: AccessTokenPayload = {
    userId: decoded.userId,
    email: decoded.email,
    name: decoded.name,
    role: decoded.role,
  };

  const newAccessToken = signAccessToken(tokenPayload);

  return res
    .status(200)
    .cookie("accessToken", newAccessToken, {
      ...options,
      maxAge: 15 * 60 * 1000,
      path: "/",
    })
    .json(
      new ApiResponse(
        200,
        { accessToken: newAccessToken },
        "Access token refreshed"
      )
    );
};

/**
 * POST /api/v1/auth/logout
 * Logout from current device only
 */
export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  const hashedToken = hashToken(refreshToken);

  await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hashedToken));

  return res
    .status(200)
    .clearCookie("accessToken", {
      ...options,
      path: "/",
    })
    .clearCookie("refreshToken", {
      ...options,
      path: "/",
    })
    .json(new ApiResponse(200, {}, "User logged out successfully"));
};

/**
 * POST /api/v1/auth/logout-all
 * Logout from all devices (invalidate all refresh tokens)
 */
export const logoutAll = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

  return res
    .status(200)
    .clearCookie("accessToken", {
      ...options,
      path: "/",
    })
    .clearCookie("refreshToken", {
      ...options,
      path: "/",
    })
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
