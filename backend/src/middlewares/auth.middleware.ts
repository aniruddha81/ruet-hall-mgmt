import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db } from "../db/index.ts";
import { hallAdmins, uniStudents } from "../db/models/auth.models.ts";
import {
  clearAuthCookies,
  verifyAccessToken,
} from "../modules/auth/auth.service.ts";
import type { Role } from "../types/enums.ts";
import ApiError from "../utils/ApiError.ts";

/**
 * Verify the access token, hydrate the live account from the DB, and reject
 * the request if the account is deactivated / rejected / deleted. Anything
 * that should make the frontend stop replaying its cookies (account gone,
 * suspended, rejected) responds with 401 *and* a Set-Cookie clearing both
 * auth cookies, so the proxy/middleware never loops on a dead cookie.
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prefer Authorization header (Bearer), fall back to the httpOnly cookie.
  let token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    token = req.cookies?.accessToken;
  }

  if (!token) {
    throw new ApiError(401, "Access token is required");
  }

  let decoded: ReturnType<typeof verifyAccessToken>;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    // jsonwebtoken is CJS — use `name` instead of named ESM imports for errors.
    if (err instanceof Error && err.name === "TokenExpiredError") {
      // Don't clear cookies here — the frontend interceptor relies on a 401
      // (with the refreshToken cookie still set) to trigger a silent renew.
      throw new ApiError(401, "Access token has expired");
    }
    if (err instanceof Error && err.name === "JsonWebTokenError") {
      // Bad signature / malformed token = abandon the session entirely.
      clearAuthCookies(res);
      throw new ApiError(401, "Invalid access token");
    }
    throw new ApiError(401, "Could not authenticate access token");
  }

  if (decoded.role === "STUDENT") {
    const [student] = await db
      .select()
      .from(uniStudents)
      .where(eq(uniStudents.id, decoded.userId))
      .limit(1);

    if (!student) {
      clearAuthCookies(res);
      throw new ApiError(401, "Account no longer exists.");
    }

    if (!student.isActive || student.status !== "ACTIVE") {
      clearAuthCookies(res);
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

    req.authAccount = { kind: "STUDENT", student };
  } else {
    const [admin] = await db
      .select()
      .from(hallAdmins)
      .where(eq(hallAdmins.id, decoded.userId))
      .limit(1);

    if (!admin) {
      clearAuthCookies(res);
      throw new ApiError(401, "Account no longer exists.");
    }

    if (!admin.isActive) {
      clearAuthCookies(res);
      throw new ApiError(403, "Admin account is deactivated.");
    }

    if (admin.hallAdminStatus !== "APPROVED") {
      clearAuthCookies(res);
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

    req.authAccount = { kind: "ADMIN", admin };
  }

  next();
};

// Role-based middleware
export const authorizeRoles = (...allowedRoles: Role[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    // Provost bypasses all role checks, or user must be in allowed roles
    if (req.user.role === "PROVOST" || allowedRoles.includes(req.user.role)) {
      return next();
    }

    throw new ApiError(
      403,
      "Forbidden: You do not have access to this resource"
    );
  };
};
