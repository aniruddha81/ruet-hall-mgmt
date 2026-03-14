import api from "@/lib/api";
import type {
  ApiResponse,
  Pagination,
  SeatAllocation,
  SeatApplication,
  SeatApplicationStatus,
} from "@/lib/types";

// =================== ADMIN ADMISSION ===================

export async function getApplications(params?: {
  status?: SeatApplicationStatus;
  page?: number;
  limit?: number;
}) {
  const res = await api.get<
    ApiResponse<{ applications: SeatApplication[]; pagination: Pagination }>
  >("/admission/applications", { params });
  // this params is like query params, it will be converted to ?status=...&hall=...&page=...&limit=...
  return res.data;
}

export async function reviewApplication(
  id: string,
  data: { status: SeatApplicationStatus },
) {
  const res = await api.patch<ApiResponse<{ application: SeatApplication }>>(
    `/admission/review/${id}/`,
    data,
  );
  return res.data;
}

export async function allocateSeat(data: {
  studentId: string;
  roomId: string;
  bedId: string;
}) {
  const res = await api.post<ApiResponse<{ allocation: SeatAllocation }>>(
    "/admission/allocate",
    data,
  );
  return res.data;
}
