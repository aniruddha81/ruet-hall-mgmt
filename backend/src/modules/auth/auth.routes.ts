import { Router } from "express";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middlewares/auth.middleware.ts";
import { validateRequest } from "../../middlewares/validateRequest.middleware.ts";
import {
  adminApplications,
  adminApproval,
  adminLogin,
  adminRegister,
  logout,
  logoutAll,
  renewAccessToken,
  studentLogin,
  studentRegister,
} from "./auth.controller.ts";
import {
  adminApprovalSchema,
  adminLoginSchema,
  adminRegisterSchema,
  refreshTokenCookieSchema,
  studentLoginSchema,
  studentRegisterSchema,
} from "./auth.validators.ts";
import type { NextFunction, Request, Response } from "express";

const authRouter = Router();

// Simple in-memory rate limiter for registration endpoints
const registerAttempts = new Map<string, { count: number; resetAt: number }>();
const REGISTER_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const REGISTER_MAX_ATTEMPTS = 5;

const registerRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = registerAttempts.get(ip);

  if (entry && now < entry.resetAt) {
    if (entry.count >= REGISTER_MAX_ATTEMPTS) {
      res.status(429).json({
        statusCode: 429,
        message: "Too many registration attempts. Try again later.",
      });
      return;
    }
    entry.count++;
  } else {
    registerAttempts.set(ip, { count: 1, resetAt: now + REGISTER_WINDOW_MS });
  }
  next();
};

// Periodic cleanup of expired entries (every 30 minutes)
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, entry] of registerAttempts) {
      if (now >= entry.resetAt) registerAttempts.delete(ip);
    }
  },
  30 * 60 * 1000
);

// public routes
// student routes
authRouter.post(
  "/register",
  registerRateLimiter,
  validateRequest(studentRegisterSchema),
  studentRegister
);
authRouter.post("/login", validateRequest(studentLoginSchema), studentLogin);

// admin routes
authRouter.post(
  "/admin/register",
  registerRateLimiter,
  validateRequest(adminRegisterSchema),
  adminRegister
);

authRouter.patch(
  "/admin/approve",
  authenticateToken,
  authorizeRoles(),
  validateRequest(adminApprovalSchema),
  adminApproval
);

authRouter.get(
  "/admin/approve",
  authenticateToken,
  authorizeRoles(),
  adminApplications
);

authRouter.post("/admin/login", validateRequest(adminLoginSchema), adminLogin);

// common routes
authRouter.post(
  "/renew-access-token",
  validateRequest(refreshTokenCookieSchema),
  renewAccessToken
);

// Protected routes
authRouter.post("/logout", authenticateToken, logout);
authRouter.post("/logout-all", authenticateToken, logoutAll);

export default authRouter;
