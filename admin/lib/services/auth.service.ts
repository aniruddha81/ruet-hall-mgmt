import api from "@/lib/api";
import type {
  AcademicDepartment,
  AcademicSession,
  AdminData,
  AdminLoginResponse,
  AdminRegisterResponse,
  ApiResponse,
  Hall,
  StaffRole,
} from "@/lib/types";

// =================== ADMIN AUTH ===================

export async function adminRegister(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  academicDepartment?: AcademicDepartment;
  hall: Hall;
  designation: StaffRole;
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

// =================== ADMIN APPLICATIONS (Provost) ===================

export async function getAdminApplications() {
  const res = await api.get<ApiResponse<{ applications: AdminData[] }>>(
    "/auth/admin/approve",
  );
  return res.data;
}

export async function approveAdmin(adminApplicationId: string, status: string) {
  const res = await api.patch<
    ApiResponse<{ adminApplicationId: string; status: string }>
  >("/auth/admin/approve", { adminApplicationId, status });
  return res.data;
}

export async function getManagedAcademicSessions() {
  const res = await api.get<ApiResponse<{ sessions: AcademicSession[] }>>(
    "/auth/sessions/manage",
  );
  return res.data;
}

export async function createAcademicSession(data: { label: string }) {
  const res = await api.post<ApiResponse<AcademicSession>>(
    "/auth/sessions",
    data,
  );
  return res.data;
}

export async function updateAcademicSession(
  sessionId: string,
  data: { label?: string; isActive?: boolean },
) {
  const res = await api.patch<ApiResponse<AcademicSession>>(
    `/auth/sessions/${sessionId}`,
    data,
  );
  return res.data;
}
