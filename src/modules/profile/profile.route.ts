import { Router } from "express";
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
import {
  changePasswordSchema,
  updateProfileSchema,
} from "./profile.validators";

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
