import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db";
import { hallAdmins, uniStudents } from "../../db/models";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { uploadOnCloudinary } from "../../utils/cloudinary";

/**
 * POST /api/v1/profile/upload-image
 * Upload user avatar image to Cloudinary
 */
export const uploadImage = async (req: Request, res: Response) => {
  const avatarLocalPath = req.file?.path;
  const userId = req.user?.userId;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatarCloudinaryUrl = await uploadOnCloudinary(avatarLocalPath);
  if (!avatarCloudinaryUrl?.url) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  if (req.user?.role === "STUDENT") {
    await db
      .update(uniStudents)
      .set({ avatarUrl: avatarCloudinaryUrl.url })
      .where(eq(uniStudents.id, userId!));
  } else {
    await db
      .update(hallAdmins)
      .set({ avatarUrl: avatarCloudinaryUrl.url })
      .where(eq(hallAdmins.id, userId!));
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
};

/**
 * GET /api/v1/profile/me
 * Get current user's full profile
 */
export const getMyProfile = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (req.user?.role === "STUDENT") {
    const [student] = await db
      .select({
        id: uniStudents.id,
        email: uniStudents.email,
        name: uniStudents.name,
        phone: uniStudents.phone,
        rollNumber: uniStudents.rollNumber,
        academicDepartment: uniStudents.academicDepartment,
        session: uniStudents.session,
        hall: uniStudents.hall,
        roomId: uniStudents.roomId,
        status: uniStudents.status,
        isAllocated: uniStudents.isAllocated,
        avatarUrl: uniStudents.avatarUrl,
        createdAt: uniStudents.createdAt,
      })
      .from(uniStudents)
      .where(eq(uniStudents.id, userId!))
      .limit(1);

    if (!student) throw new ApiError(404, "Student not found");

    res
      .status(200)
      .json(new ApiResponse(200, { profile: student }, "Profile retrieved"));
  } else {
    const [admin] = await db
      .select({
        id: hallAdmins.id,
        email: hallAdmins.email,
        name: hallAdmins.name,
        phone: hallAdmins.phone,
        academicDepartment: hallAdmins.academicDepartment,
        hall: hallAdmins.hall,
        designation: hallAdmins.designation,
        operationalUnit: hallAdmins.operationalUnit,
        avatarUrl: hallAdmins.avatarUrl,
        isActive: hallAdmins.isActive,
        createdAt: hallAdmins.createdAt,
      })
      .from(hallAdmins)
      .where(eq(hallAdmins.id, userId!))
      .limit(1);

    if (!admin) throw new ApiError(404, "Admin not found");

    res
      .status(200)
      .json(new ApiResponse(200, { profile: admin }, "Profile retrieved"));
  }
};

/**
 * PATCH /api/v1/profile/update
 * Update current user's profile (name, phone)
 */
export const updateProfile = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { name, phone } = req.body;

  const updateData: Record<string, string> = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  if (req.user?.role === "STUDENT") {
    await db
      .update(uniStudents)
      .set(updateData)
      .where(eq(uniStudents.id, userId!));
  } else {
    await db
      .update(hallAdmins)
      .set(updateData)
      .where(eq(hallAdmins.id, userId!));
  }

  res.status(200).json(new ApiResponse(200, updateData, "Profile updated"));
};

/**
 * PATCH /api/v1/profile/change-password
 * Change current user's password
 */
export const changePassword = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { currentPassword, newPassword } = req.body;

  if (req.user?.role === "STUDENT") {
    const [student] = await db
      .select({ passwordHash: uniStudents.passwordHash })
      .from(uniStudents)
      .where(eq(uniStudents.id, userId!))
      .limit(1);

    if (!student) throw new ApiError(404, "Student not found");

    const isValid = await bcrypt.compare(currentPassword, student.passwordHash);
    if (!isValid) throw new ApiError(401, "Current password is incorrect");

    const newHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(uniStudents)
      .set({ passwordHash: newHash })
      .where(eq(uniStudents.id, userId!));
  } else {
    const [admin] = await db
      .select({ passwordHash: hallAdmins.passwordHash })
      .from(hallAdmins)
      .where(eq(hallAdmins.id, userId!))
      .limit(1);

    if (!admin) throw new ApiError(404, "Admin not found");

    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValid) throw new ApiError(401, "Current password is incorrect");

    const newHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(hallAdmins)
      .set({ passwordHash: newHash })
      .where(eq(hallAdmins.id, userId!));
  }

  res.status(200).json(new ApiResponse(200, null, "Password changed"));
};
