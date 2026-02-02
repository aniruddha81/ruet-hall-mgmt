import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db";
import { users } from "../../db/models";
import { uploadOnCloudinary } from "../../utils/cloudinary";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

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

  await db
    .update(users)
    .set({ avatarUrl: avatarCloudinaryUrl.url })
    .where(eq(users.id, userId));

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
