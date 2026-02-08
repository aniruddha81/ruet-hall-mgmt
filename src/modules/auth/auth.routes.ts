import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.ts";
import { validateRequest } from "../../middlewares/validateRequest.middleware.ts";
import {
  adminLogin,
  adminRegister,
  logout,
  logoutAll,
  renewAccessToken,
  studentLogin,
  studentRegister,
} from "./auth.controller.ts";
import {
  adminLoginSchema,
  adminRegisterSchema,
  refreshTokenCookieSchema,
  studentLoginSchema,
  studentRegisterSchema,
} from "./auth.validators.ts";

const authRouter = Router();

// public routes
// student routes
authRouter.post(
  "/register",
  validateRequest(studentRegisterSchema),
  studentRegister
);
authRouter.post("/login", validateRequest(studentLoginSchema), studentLogin);

// admin routes
authRouter.post(
  "/admin/register",
  validateRequest(adminRegisterSchema),
  adminRegister
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
