import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/multer.middleware";
import { uploadImage } from "./profile.controller";
const profileRouter = Router();

// Protected routes
profileRouter.post(
  "/upload-image",
  authenticateToken,
  upload.single("avatar"),
  uploadImage
);

export default profileRouter;
