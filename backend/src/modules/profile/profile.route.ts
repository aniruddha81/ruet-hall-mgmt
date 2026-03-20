import { Router } from "express";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middlewares/auth.middleware.ts";
import { upload } from "../../middlewares/multer.middleware.ts";
import { validateRequest } from "../../middlewares/validateRequest.middleware.ts";
import { ROLES } from "../../types/enums.ts";
import {
  changePassword,
  getMyProfile,
  updateProfile,
  uploadImage,
} from "./profile.controller.ts";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "./profile.validators.ts";

const profileRouter = Router();

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
