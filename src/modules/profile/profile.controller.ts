import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db";
import { hallAdmins, uniStudents } from "../../db/models";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { uploadOnCloudinary } from "../../utils/cloudinary";

/**
 * POST /api/v1/profile/upload-image
 * Upload user avatar image to Cloudinary
 */
export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  const avatarLocalPath = req.file?.path;
  const userId = req.user?.userId;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const avatarCloudinaryUrl = await uploadOnCloudinary(avatarLocalPath);
  if (!avatarCloudinaryUrl?.url) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  if (req.user?.role === "STUDENT") {
    await db
      .update(uniStudents)
      .set({ avatarUrl: avatarCloudinaryUrl.url })
      .where(eq(uniStudents.id, userId));
  } else {
    await db
      .update(hallAdmins)
      .set({ avatarUrl: avatarCloudinaryUrl.url })
      .where(eq(hallAdmins.id, userId));
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { avatarUrl: avatarCloudinaryUrl.url },
        "Avatar uploaded successfully"
      )
    );
});
