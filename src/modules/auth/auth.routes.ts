import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.ts";
import { validateRequest } from "../../middlewares/validateRequest.middleware.ts";
import {
  login,
  logout,
  logoutAll,
  register,
  renewAccessToken,
} from "./auth.controller.ts";
import {
  loginSchema,
  refreshTokenCookieSchema,
  registerSchema,
} from "./auth.schema.ts";

const authRouter = Router();

// public routes
authRouter.post("/register", validateRequest(registerSchema), register);
authRouter.post("/login", validateRequest(loginSchema), login);
authRouter.post(
  "/renew-access-token",
  validateRequest(refreshTokenCookieSchema),
  renewAccessToken
);

// Protected routes
authRouter.post("/logout", authenticateToken, logout);
authRouter.post("/logout-all", authenticateToken, logoutAll);

export default authRouter;
