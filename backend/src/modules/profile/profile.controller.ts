import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db/index.ts";
import { hallAdmins, uniStudents } from "../../db/models/index.ts";
import { invalidateAuthAccountCache } from "../../lib/cache.ts";
import { revokeAllUserSessions } from "../../lib/sessionStore.ts";
import ApiError from "../../utils/ApiError.ts";
import ApiResponse from "../../utils/ApiResponse.ts";
import {
  cloudinaryDeliveryUrl,
  uploadOnCloudinary,
} from "../../utils/cloudinary.ts";

/**
 * POST /api/profile/upload-image
 * Upload user avatar image to Cloudinary
 */
export const uploadImage = async (req: Request, res: Response) => {
  const avatarLocalPath = req.file?.path;
  const authAccount = req.authAccount;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  if (!authAccount) {
    throw new ApiError(401, "Authentication required");
  }

  const avatarCloudinaryUrl = await uploadOnCloudinary(avatarLocalPath);
  const avatarUrl = cloudinaryDeliveryUrl(avatarCloudinaryUrl);
  if (!avatarUrl) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  if (authAccount.type === "STUDENT") {
    await db
      .update(uniStudents)
      .set({ avatarUrl })
      .where(eq(uniStudents.id, authAccount.student.id));

    authAccount.student.avatarUrl = avatarUrl;
  } else {
    await db
      .update(hallAdmins)
      .set({ avatarUrl })
      .where(eq(hallAdmins.id, authAccount.admin.id));

    authAccount.admin.avatarUrl = avatarUrl;
  }

  await invalidateAuthAccountCache(
    authAccount.type === "STUDENT"
      ? authAccount.student.id
      : authAccount.admin.id,
    authAccount.type
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { avatarUrl },
        "Avatar uploaded successfully"
      )
    );
};

/**
 * GET /api/profile/me
 * Get current user's full profile
 */
export const getMyProfile = async (req: Request, res: Response) => {
  const authAccount = req.authAccount;

  if (!authAccount) {
    throw new ApiError(401, "Authentication required");
  }

  if (authAccount.type === "STUDENT") {
    const student = authAccount.student;

    const profile = {
      id: student.id,
      email: student.email,
      name: student.name,
      phone: student.phone,
      rollNumber: student.rollNumber,
      academicDepartment: student.academicDepartment,
      session: student.session,
      hall: student.hall,
      roomId: student.roomId,
      status: student.status,
      isAllocated: student.isAllocated,
      avatarUrl: student.avatarUrl,
      createdAt: student.createdAt,
    };

    res
      .status(200)
      .json(new ApiResponse(200, { profile }, "Profile retrieved"));
  } else {
    const admin = authAccount.admin;

    const profile = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      phone: admin.phone,
      academicDepartment: admin.academicDepartment,
      hall: admin.hall,
      designation: admin.designation,
      operationalUnit: admin.operationalUnit,
      avatarUrl: admin.avatarUrl,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    };

    res
      .status(200)
      .json(new ApiResponse(200, { profile }, "Profile retrieved"));
  }
};

/**
 * PATCH /api/profile/update
 * Update current user's profile (name, phone)
 */
export const updateProfile = async (req: Request, res: Response) => {
  const authAccount = req.authAccount;
  const { name, phone } = req.body;

  if (!authAccount) {
    throw new ApiError(401, "Authentication required");
  }

  const updateData: Record<string, string> = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  if (authAccount.type === "STUDENT") {
    await db
      .update(uniStudents)
      .set(updateData)
      .where(eq(uniStudents.id, authAccount.student.id));

    if (name) {
      authAccount.student.name = name;
    }
    if (phone) {
      authAccount.student.phone = phone;
    }
  } else {
    await db
      .update(hallAdmins)
      .set(updateData)
      .where(eq(hallAdmins.id, authAccount.admin.id));

    if (name) {
      authAccount.admin.name = name;
    }
    if (phone) {
      authAccount.admin.phone = phone;
    }
  }

  if (req.user && name) {
    req.user.name = name;
  }

  await invalidateAuthAccountCache(
    authAccount.type === "STUDENT"
      ? authAccount.student.id
      : authAccount.admin.id,
    authAccount.type
  );

  res.status(200).json(new ApiResponse(200, updateData, "Profile updated"));
};

/**
 * PATCH /api/profile/change-password
 * Change current user's password
 */
export const changePassword = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { currentPassword, newPassword } = req.body;
  const authAccount = req.authAccount;

  if (!authAccount) {
    throw new ApiError(401, "Authentication required");
  }

  if (authAccount.type === "STUDENT") {
    const student = authAccount.student;

    const isValid = await bcrypt.compare(currentPassword, student.passwordHash);
    if (!isValid) throw new ApiError(401, "Current password is incorrect");

    const newHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(uniStudents)
      .set({ passwordHash: newHash })
      .where(eq(uniStudents.id, userId!));
    await revokeAllUserSessions(userId!);
  } else {
    const admin = authAccount.admin;

    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValid) throw new ApiError(401, "Current password is incorrect");

    const newHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(hallAdmins)
      .set({ passwordHash: newHash })
      .where(eq(hallAdmins.id, userId!));
    await revokeAllUserSessions(userId!);
  }

  res.status(200).json(new ApiResponse(200, null, "Password changed"));
};
