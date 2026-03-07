import { Router } from "express";
import { z } from "zod";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/multer.middleware";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { ROLES } from "../../types/enums";
import {
  changePassword,
  getMyProfile,
  updateProfile,
  uploadImage,
} from "./profile.controller";

const profileRouter = Router();

const updateProfileSchema = {
  body: z.object({
    name: z.string().min(2).max(255).optional(),
    phone: z.string().max(20).optional(),
  }),
};

const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[0-9]/, "Password must include a number")
      .regex(/[^A-Za-z0-9]/, "Password must include a special character"),
  }),
};

// Protected routes
profileRouter.get(
  "/me",
  authenticateToken,
  authorizeRoles(...Object.values(ROLES)),
  getMyProfile
);

profileRouter.patch(
  "/update",
  authenticateToken,
  authorizeRoles(...Object.values(ROLES)),
  validateRequest(updateProfileSchema),
  updateProfile
);

profileRouter.patch(
  "/change-password",
  authenticateToken,
  authorizeRoles(...Object.values(ROLES)),
  validateRequest(changePasswordSchema),
  changePassword
);

profileRouter.post(
  "/upload-image",
  authenticateToken,
  authorizeRoles(...Object.values(ROLES)),
  upload.single("avatar"),
  uploadImage
);

export default profileRouter;
