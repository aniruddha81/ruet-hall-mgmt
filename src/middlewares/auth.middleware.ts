import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { verifyAccessToken } from "../utils/auth.ts";

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
      req.user = decoded; // Now type-safe via Express.Request extension
      next();
    } catch {
      throw new ApiError(401, "Invalid or expired access token");
    }
  }
);

// Role-based middleware
export const authorizeRoles = (...allowedRoles: string[]) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userRole = req.user?.role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        throw new ApiError(
          403,
          "Forbidden: You do not have access to this resource"
        );
      }

      next();
    }
  );
};
