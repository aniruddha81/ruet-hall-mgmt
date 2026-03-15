import api from "@/lib/api";
import type { ApiResponse, StudentData } from "@/lib/types";

// =================== PROFILE ===================

export async function getMyProfile() {
  const res = await api.get<ApiResponse<{ profile: StudentData }>>("/profile/me");
  return res.data;
}

export async function updateProfile(data: { name?: string; phone?: string }) {
  const res = await api.patch<ApiResponse<Record<string, string>>>(
    "/profile/update",
    data,
  );
  return res.data;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const res = await api.patch<ApiResponse<null>>(
    "/profile/change-password",
    data,
  );
  return res.data;
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await api.post<ApiResponse<{ avatarUrl: string }>>(
    "/profile/upload-image",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return res.data;
}
