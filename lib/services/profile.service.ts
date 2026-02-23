import api from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

// =================== PROFILE ===================

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
