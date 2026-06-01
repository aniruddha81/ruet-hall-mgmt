import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE_NAME } from "../Constants.ts";
import { db } from "../db/index.ts";
import { hallAdmins, uniStudents } from "../db/models/auth.models.ts";
import { cacheGet, cacheKeys, cacheSet, cacheTtlSec } from "../lib/cache.ts";
import {
  getSession,
  revokeAllUserSessions,
  touchSession,
} from "../lib/sessionStore.ts";
import { clearSessionCookie } from "../modules/auth/auth.service.ts";
import type { Role } from "../types/enums.ts";
import ApiError from "../utils/ApiError.ts";

type StudentRow = typeof uniStudents.$inferSelect;
type AdminRow = typeof hallAdmins.$inferSelect;

async function loadStudentAccount(
  userId: string
): Promise<StudentRow | undefined> {
  const key = cacheKeys.authAccountStudent(userId);
  const cached = await cacheGet<StudentRow>(key);
  if (cached) {
    return cached;
  }

  const [student] = await db
    .select()
    .from(uniStudents)
    .where(eq(uniStudents.id, userId))
    .limit(1);

  if (student) {
    await cacheSet(key, student, cacheTtlSec.authAccount);
  }

  return student;
}

async function loadAdminAccount(userId: string): Promise<AdminRow | undefined> {
  const key = cacheKeys.authAccountAdmin(userId);
  const cached = await cacheGet<AdminRow>(key);
  if (cached) {
    return cached;
  }

  const [admin] = await db
    .select()
    .from(hallAdmins)
    .where(eq(hallAdmins.id, userId))
    .limit(1);

  if (admin) {
    await cacheSet(key, admin, cacheTtlSec.authAccount);
  }

  return admin;
}

function readSessionId(req: Request): string | undefined {
  const bearer = req.headers.authorization?.split(" ")[1];
  if (bearer) {
    return bearer;
  }
  return req.cookies?.[SESSION_COOKIE_NAME];
}

/**
 * Resolve the live Redis session, hydrate the account from PostgreSQL, and reject
 * deactivated / missing accounts. Invalid sessions clear the cookie so
 * frontends do not loop on a dead session id.
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sessionId = readSessionId(req);
  if (!sessionId) {
    throw new ApiError(401, "Session is required");
  }

  const liveSession = await getSession(sessionId);
  if (!liveSession) {
    clearSessionCookie(res);
    throw new ApiError(401, "Session is invalid or has expired");
  }

  await touchSession(sessionId);

  if (liveSession.role === "STUDENT") {
    const student = await loadStudentAccount(liveSession.userId);
    if (!student) {
      await revokeAllUserSessions(liveSession.userId);
      clearSessionCookie(res);
      throw new ApiError(401, "Account no longer exists.");
    }

    if (!student.isVerified) {
      await revokeAllUserSessions(student.id);
      clearSessionCookie(res);
      throw new ApiError(403, "Please verify your email before using the app.");
    }

    if (!student.isActive || student.status !== "ACTIVE") {
      await revokeAllUserSessions(student.id);
      clearSessionCookie(res);
      throw new ApiError(
        403,
        `Account is ${student.status.toLowerCase()}. Please contact administration.`
      );
    }

    req.user = {
      userId: student.id,
      email: student.email,
      name: student.name,
      role: "STUDENT",
      rollNumber: student.rollNumber,
      hall: student.hall,
    };
    req.authAccount = { type: "STUDENT", student };
  } else {
    const admin = await loadAdminAccount(liveSession.userId);
    if (!admin) {
      await revokeAllUserSessions(liveSession.userId);
      clearSessionCookie(res);
      throw new ApiError(401, "Account no longer exists.");
    }

    if (!admin.isActive) {
      await revokeAllUserSessions(admin.id);
      clearSessionCookie(res);
      throw new ApiError(403, "Admin account is deactivated.");
    }

    if (admin.hallAdminStatus !== "APPROVED") {
      await revokeAllUserSessions(admin.id);
      clearSessionCookie(res);
      throw new ApiError(
        403,
        `Admin application is ${admin.hallAdminStatus.toLowerCase()}.`
      );
    }

    req.user = {
      userId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.designation,
      hall: admin.hall,
    };
    req.authAccount = { type: "ADMIN", admin };
  }

  req.sessionId = sessionId;
  next();
};

// Role-based middleware
export const authorizeRoles = (...allowedRoles: Role[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    if (req.user.role === "PROVOST" || allowedRoles.includes(req.user.role)) {
      return next();
    }

    throw new ApiError(
      403,
      "Forbidden: You do not have access to this resource"
    );
  };
};

/** Role check without PROVOST bypass (e.g. DSW-only admission routes). */
export const authorizeExactRoles = (...allowedRoles: Role[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    throw new ApiError(
      403,
      "Forbidden: You do not have access to this resource"
    );
  };
};
