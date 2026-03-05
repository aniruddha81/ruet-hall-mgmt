import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db } from "../db/index.ts";
import { hallAdmins, uniStudents } from "../db/models/auth.models.ts";
import { verifyAccessToken } from "../modules/auth/auth.service.ts";
import type { Role } from "../types/enums.ts";
import { ApiError } from "../utils/ApiError.ts";

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Try Authorization header first (Bearer token)
  let token = req.headers["authorization"]?.split(" ")[1];

  // Fallback to httpOnly cookie
  if (!token) {
    token = req.cookies?.accessToken;
  }

  if (!token) {
    throw new ApiError(401, "Access token is required");
  }

  try {
    const decoded = verifyAccessToken(token);

    if (decoded.role === "STUDENT") {
      const [student] = await db
        .select()
        .from(uniStudents)
        .where(eq(uniStudents.id, decoded.userId))
        .limit(1);

      if (!student) {
        throw new ApiError(401, "Student not found or has been deleted");
      }

      req.user = {
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
        throw new ApiError(401, "Admin not found or has been deleted");
      }

      req.user = {
        userId: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.designation,
        rollNumber: undefined,
      };
    }

    next();
  } catch {
    throw new ApiError(401, "Invalid or expired access token");
  }
};

// Role-based middleware
export const authorizeRoles = (...allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
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
