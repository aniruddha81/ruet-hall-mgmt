import api from "@/lib/api";
import type {
  AcademicDepartment,
  ApiResponse,
  LoginResponse,
  RegisterResponse,
} from "@/lib/types";

// =================== STUDENT AUTH ===================

export async function studentRegister(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  rollNumber: number;
  academicDepartment: AcademicDepartment;
  session: string;
  phone: string;
}) {
  const res = await api.post<ApiResponse<RegisterResponse>>(
    "/auth/register",
    data,
  );
  return res.data;
}

export async function studentLogin(data: { email: string; password: string }) {
  const res = await api.post<ApiResponse<LoginResponse>>("/auth/login", data);
  return res.data;
}

export async function renewAccessToken() {
  const res = await api.post<ApiResponse<{ accessToken: string }>>(
    "/auth/renew-access-token",
  );
  return res.data;
}

export async function logout() {
  const res = await api.post<ApiResponse<object>>("/auth/logout");
  return res.data;
}

export async function logoutAll() {
  const res = await api.post<ApiResponse<null>>("/auth/logout-all");
  return res.data;
}
