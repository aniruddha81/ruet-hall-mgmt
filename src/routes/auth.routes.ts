import { Router } from "express";
import {
  login,
  logout,
  logoutAll,
  refreshAccessToken,
  register,
} from "../controllers/auth.controller.ts";
import { authenticateToken } from "../middlewares/auth.middleware.ts";
import { validateRequest } from "../middlewares/validateRequest.middleware.ts";
import { loginSchema, refreshTokenCookieSchema, registerSchema } from "../validators/authValidators.ts";

const authRouter = Router();

// public routes
authRouter.post("/register", validateRequest(registerSchema), register);
authRouter.post("/login", validateRequest(loginSchema), login);
authRouter.post(
  "/refresh-access-token",
  validateRequest(refreshTokenCookieSchema),
  refreshAccessToken
);
authRouter.post("/logout", logout);

// Protected routes
authRouter.post("/logout-all", authenticateToken, logoutAll);

export default authRouter;
