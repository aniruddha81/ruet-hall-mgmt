import api from "@/lib/api";
import type {
  AcademicDepartment,
  AdminLoginResponse,
  AdminRegisterResponse,
  ApiResponse,
  Hall,
  OperationalUnit,
  StaffRole,
} from "@/lib/types";

// =================== ADMIN AUTH ===================

export async function adminRegister(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  academicDepartment: AcademicDepartment;
  hall: Hall;
  designation: StaffRole;
  operationalUnit: OperationalUnit;
  phone: string;
}) {
  const res = await api.post<ApiResponse<AdminRegisterResponse>>(
    "/auth/admin/register",
    data,
  );
  return res.data;
}

export async function adminLogin(data: { email: string; password: string }) {
  const res = await api.post<ApiResponse<AdminLoginResponse>>(
    "/auth/admin/login",
    data,
  );
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
