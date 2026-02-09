import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db } from "../db/index.ts";
import { users } from "../db/models/auth.models.ts";
import { verifyAccessToken } from "../modules/auth/auth.service.ts";
import type { Role } from "../types/enums.ts";
import { ApiError } from "../utils/ApiError.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";

export const authenticateToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (!user) {
        throw new ApiError(401, "User not found or has been deleted");
      }

      req.user = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      next();
    } catch {
      throw new ApiError(401, "Invalid or expired access token");
    }
  }
);

// Role-based middleware
export const authorizeRoles = (...allowedRoles: Role[]) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
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
    }
  );
};
