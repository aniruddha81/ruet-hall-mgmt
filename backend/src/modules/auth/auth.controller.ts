import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { and, desc, eq, not } from "drizzle-orm";
import type { Request, Response } from "express";
import { SESSION_COOKIE_NAME } from "../../Constants.ts";
import { db } from "../../db/index.ts";
import {
  academicSessions,
  hallAdmins,
  uniStudents,
} from "../../db/models/index.ts";
import {
  cacheDel,
  cacheGet,
  cacheKeys,
  cacheSet,
  cacheTtlSec,
  invalidateAuthAccountCache,
} from "../../lib/cache.ts";
import {
  enforceSessionLimitOrThrow,
  listUserSessions,
  revokeAllUserSessions,
  revokeSession,
} from "../../lib/sessionStore.ts";
import { type OperationalUnit } from "../../types/enums.ts";
import ApiError from "../../utils/ApiError.ts";
import ApiResponse from "../../utils/ApiResponse.ts";
import type { SessionUserPayload } from "./auth.d.ts";
import {
  assertCanResendStudentOtp,
  generateOtpCode,
  markStudentOtpResendCooldown,
  storeStudentVerifyOtp,
  STUDENT_OTP_RESEND_COOLDOWN_SEC,
  STUDENT_VERIFY_OTP_TTL_SEC,
  verifyAndConsumeStudentOtp,
} from "../../lib/otpStore.ts";
import { purgeStudentAccount } from "../../lib/studentAccountDeletion.ts";
import {
  clearSessionCookie,
  createSessionAndSetCookie,
  sendStudentVerificationOtpEmail,
  toStudentLoginData,
} from "./auth.service.ts";

/**
 * POST /api/auth/register
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

  if (existingUser?.isVerified) {
    throw new ApiError(409, "User with this email already exists");
  }

  const [rollTaken] = await db
    .select({ id: uniStudents.id })
    .from(uniStudents)
    .where(eq(uniStudents.rollNumber, String(rollNumber)))
    .limit(1);

  if (rollTaken && rollTaken.id !== existingUser?.id) {
    throw new ApiError(409, "Roll number already registered");
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
  const rollNumberStr = String(rollNumber);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    await db
      .update(uniStudents)
      .set({
        passwordHash,
        name,
        phone,
        rollNumber: rollNumberStr,
        academicDepartment,
        session,
        isVerified: false,
      })
      .where(eq(uniStudents.id, userId));
    await invalidateAuthAccountCache(userId, "STUDENT");
  } else {
    userId = randomUUID();
    await db.insert(uniStudents).values({
      id: userId,
      email,
      passwordHash,
      name,
      phone,
      rollNumber: rollNumberStr,
      academicDepartment,
      session,
      isAllocated: false,
      isVerified: false,
    });
  }

  await assertCanResendStudentOtp(userId);
  const otp = generateOtpCode();
  await storeStudentVerifyOtp(userId, otp);
  await markStudentOtpResendCooldown(userId);
  await sendStudentVerificationOtpEmail(
    email,
    name,
    otp,
    Math.floor(STUDENT_VERIFY_OTP_TTL_SEC / 60)
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: userId,
          email,
          name,
        },
        requiresVerification: true,
        otpExpiresInSec: STUDENT_VERIFY_OTP_TTL_SEC,
        resendCooldownSec: STUDENT_OTP_RESEND_COOLDOWN_SEC,
      },
      "Verification code sent to your email"
    )
  );
};

/**
 * POST /api/auth/verify-email
 * Confirm student email with OTP stored in Redis
 */
export const studentVerifyEmail = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const [user] = await db
    .select()
    .from(uniStudents)
    .where(eq(uniStudents.email, email))
    .limit(1);

  if (!user) {
    throw new ApiError(404, "No account found with this email");
  }

  if (user.isVerified) {
    throw new ApiError(400, "Email is already verified. You can sign in.");
  }

  const otpValid = await verifyAndConsumeStudentOtp(user.id, otp);
  if (!otpValid) {
    throw new ApiError(400, "Invalid or expired verification code");
  }

  await db
    .update(uniStudents)
    .set({ isVerified: true })
    .where(eq(uniStudents.id, user.id));
  await invalidateAuthAccountCache(user.id, "STUDENT");

  const [verifiedUser] = await db
    .select()
    .from(uniStudents)
    .where(eq(uniStudents.id, user.id))
    .limit(1);

  if (!verifiedUser?.isVerified) {
    throw new ApiError(500, "Failed to verify account");
  }

  const sessionPayload: SessionUserPayload = {
    userId: verifiedUser.id,
    email: verifiedUser.email,
    name: verifiedUser.name,
    role: "STUDENT",
  };

  await enforceSessionLimitOrThrow(verifiedUser.id);
  await createSessionAndSetCookie({ req, res, payload: sessionPayload });

  return res.status(200).json(
    new ApiResponse(
      200,
      { student_data: toStudentLoginData(verifiedUser) },
      "Email verified successfully"
    )
  );
};

/**
 * POST /api/auth/resend-otp
 * Resend verification OTP for an unverified student account
 */
export const studentResendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;

  const [user] = await db
    .select()
    .from(uniStudents)
    .where(eq(uniStudents.email, email))
    .limit(1);

  if (!user) {
    throw new ApiError(404, "No account found with this email");
  }

  if (user.isVerified) {
    throw new ApiError(400, "Email is already verified. You can sign in.");
  }

  await assertCanResendStudentOtp(user.id);
  const otp = generateOtpCode();
  await storeStudentVerifyOtp(user.id, otp);
  await markStudentOtpResendCooldown(user.id);
  await sendStudentVerificationOtpEmail(
    email,
    user.name,
    otp,
    Math.floor(STUDENT_VERIFY_OTP_TTL_SEC / 60)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        otpExpiresInSec: STUDENT_VERIFY_OTP_TTL_SEC,
        resendCooldownSec: STUDENT_OTP_RESEND_COOLDOWN_SEC,
      },
      "Verification code resent"
    )
  );
};

/**
 * GET /api/auth/sessions
 * Public endpoint to retrieve active sessions for student signup
 */
export const getActiveAcademicSessions = async (
  _req: Request,
  res: Response
) => {
  const cacheKey = cacheKeys.activeAcademicSessions();
  type ActiveSession = { id: string; label: string };

  const cached = await cacheGet<ActiveSession[]>(cacheKey);
  const sessions =
    cached ??
    (await db
      .select({
        id: academicSessions.id,
        label: academicSessions.label,
      })
      .from(academicSessions)
      .where(eq(academicSessions.isActive, true))
      .orderBy(desc(academicSessions.createdAt)));

  if (!cached) {
    await cacheSet(cacheKey, sessions, cacheTtlSec.activeAcademicSessions);
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { sessions }, "Sessions retrieved successfully")
    );
};

/**
 * GET /api/auth/sessions/manage
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
 * POST /api/auth/sessions
 * Create a new academic session (allowed for non-dining admins)
 */
export const createAcademicSession = async (req: Request, res: Response) => {
  const admin =
    req.authAccount?.type === "ADMIN" ? req.authAccount.admin : null;
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

  await cacheDel(cacheKeys.activeAcademicSessions());

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
 * PATCH /api/auth/sessions/:sessionId
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

  await cacheDel(cacheKeys.activeAcademicSessions());

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
 * POST /api/auth/login
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

  if (!user.isVerified) {
    throw new ApiError(
      403,
      "Please verify your email before signing in. Check your inbox for the verification code."
    );
  }

  if (!user.isActive || user.status !== "ACTIVE") {
    throw new ApiError(
      403,
      `Account is ${user.status.toLowerCase()}. Please contact administration.`
    );
  }

  const sessionPayload: SessionUserPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: "STUDENT",
  };

  await enforceSessionLimitOrThrow(user.id);
  await createSessionAndSetCookie({ req, res, payload: sessionPayload });

  return res.status(200).json(
    new ApiResponse(
      200,
      { student_data: toStudentLoginData(user) },
      "User logged in successfully"
    )
  );
};

/**
 * POST /api/auth/admin/register
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

  const sessionPayload: SessionUserPayload = {
    userId: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.designation,
  };

  res.status(201).json(
    new ApiResponse(
      201,
      {
        user: sessionPayload,
      },
      "Admin registration pending"
    )
  );
};

/**
 * POST /api/auth/admin/approval
 * Update an admin application's approval status (provost only)
 */
export const adminApproval = async (req: Request, res: Response) => {
  const { adminApplicationId, status } = req.body;

  const admin =
    req.authAccount?.type === "ADMIN" ? req.authAccount.admin : null;

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
 * GET /api/auth/admin/applications
 * Retrieve pending admin applications (provost only)
 */
export const adminApplications = async (req: Request, res: Response) => {
  const admin =
    req.authAccount?.type === "ADMIN" ? req.authAccount.admin : null;

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
 * POST /api/auth/admin/login
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

  const sessionPayload: SessionUserPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.designation,
  };

  await enforceSessionLimitOrThrow(user.id);
  await createSessionAndSetCookie({ req, res, payload: sessionPayload });

  return res.status(200).json(
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
 * POST /api/auth/logout
 * Logout from the current device (revoke this Redis session).
 */
export const logout = async (req: Request, res: Response) => {
  const sessionId =
    req.sessionId ?? req.cookies?.[SESSION_COOKIE_NAME];

  if (sessionId) {
    await revokeSession(sessionId);
  }

  return clearSessionCookie(res)
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
};

/**
 * POST /api/auth/delete-account
 * Permanently delete the signed-in student account and all related data.
 */
export const deleteStudentAccount = async (req: Request, res: Response) => {
  const authAccount = req.authAccount;

  if (!authAccount || authAccount.type !== "STUDENT") {
    throw new ApiError(
      403,
      "Only student accounts can be deleted through this endpoint"
    );
  }

  const { password } = req.body as { password: string };
  const student = authAccount.student;

  const isPasswordValid = await bcrypt.compare(password, student.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  await purgeStudentAccount(student.id);

  return clearSessionCookie(res)
    .status(200)
    .json(new ApiResponse(200, null, "Account deleted permanently"));
};

/**
 * POST /api/auth/logout-all
 * Logout from all devices (revoke every Redis session for this user).
 */
export const logoutAll = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  await revokeAllUserSessions(userId);

  return clearSessionCookie(res)
    .status(200)
    .json(
      new ApiResponse(200, null, "Logged out from all devices successfully")
    );
};

/**
 * GET /api/auth/devices
 * List active Redis sessions for the signed-in user.
 */
export const getActiveDeviceSessions = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  const sessions = await listUserSessions(userId);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        sessions: sessions.map((s) => ({
          id: s.sessionId,
          ip: s.ip,
          userAgent: s.userAgent,
          createdAt: s.createdAt,
          isCurrent: s.sessionId === req.sessionId,
        })),
      },
      "Active sessions retrieved"
    )
  );
};

/**
 * DELETE /api/auth/devices/:sessionId
 * Revoke a specific device session (must belong to the current user).
 */
export const revokeDeviceSession = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { sessionId } = req.params as { sessionId: string };

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  const sessions = await listUserSessions(userId);
  const target = sessions.find((s) => s.sessionId === sessionId);

  if (!target) {
    throw new ApiError(404, "Session not found");
  }

  await revokeSession(sessionId);

  const resBody = new ApiResponse(200, null, "Session revoked successfully");

  if (sessionId === req.sessionId) {
    return clearSessionCookie(res).status(200).json(resBody);
  }

  return res.status(200).json(resBody);
};
