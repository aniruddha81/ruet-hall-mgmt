import { Router } from "express";
import { uploadImage } from "../controllers/profile.controller";
import { upload } from "../middlewares/multer.middleware";
import { authenticateToken } from "../middlewares/auth.middleware";
const profileRouter = Router();

// Protected routes
profileRouter.post(
  "/upload-image",
  authenticateToken,
  upload.single("avatar"),
  uploadImage
);

export default profileRouter;
