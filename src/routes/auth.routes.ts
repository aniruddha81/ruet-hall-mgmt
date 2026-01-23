import { Router } from "express";
import {
  login,
  logout,
  logoutAll,
  refreshAccessToken,
  register,
} from "../controllers/auth.controller.ts";
import { authenticateToken } from "../middlewares/auth.middleware.ts";

const authRouter = Router();

// public routes
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh-access-token", refreshAccessToken);
authRouter.post("/logout", logout);

// Protected routes
authRouter.post("/logout-all", authenticateToken, logoutAll);

export default authRouter;
