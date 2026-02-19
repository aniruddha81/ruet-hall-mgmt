import { Router } from "express";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/multer.middleware";
import { uploadImage } from "./profile.controller";
import { ROLES } from "../../types/enums";
const profileRouter = Router();

// Protected routes
profileRouter.post(
  "/upload-image",
  authenticateToken,
  authorizeRoles(...Object.values(ROLES)),
  upload.single("avatar"),
  uploadImage
);

export default profileRouter;
