import api from "@/lib/api";
import type {
  AcademicDepartment,
  ApiResponse,
  Hall,
  SeatApplication,
} from "@/lib/types";

// =================== STUDENT ADMISSION ===================

export async function applyForSeat(data: {
  hall: Hall;
  academicDepartment: AcademicDepartment;
  session: string;
}) {
  const res = await api.post<ApiResponse<{ application: SeatApplication }>>(
    "/admission/apply",
    data,
  );
  return res.data;
}

export async function getMyApplicationStatus() {
  const res = await api.get<ApiResponse<{ application: SeatApplication }>>(
    "/admission/my-status",
  );
  return res.data;
}
