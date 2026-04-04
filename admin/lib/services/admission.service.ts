import api from "@/lib/api";
import type {
  ApiResponse,
  Pagination,
  SeatAllocation,
  SeatApplication,
  SeatApplicationStatus,
  StudentDue,
} from "@/lib/types";

type RawStudentDue = {
  id: string;
  studentId: string;
  hall: StudentDue["hall"];
  type: StudentDue["dueType"];
  amount: number;
  status: StudentDue["dueStatus"];
  paidAt: string | null;
  createdAt: string;
  updatedAt?: string;
};

type RawSeatApplication = Omit<SeatApplication, "seatCharge"> & {
  seatCharge?: RawStudentDue | null;
};

function mapDue(raw: RawStudentDue): StudentDue {
  return {
    id: raw.id,
    studentId: raw.studentId,
    dueType: raw.type,
    hall: raw.hall,
    amount: raw.amount,
    dueStatus: raw.status,
    paidAt: raw.paidAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapApplication(raw: RawSeatApplication): SeatApplication {
  return {
    ...raw,
    seatCharge: raw.seatCharge ? mapDue(raw.seatCharge) : null,
  };
}

// =================== ADMIN ADMISSION ===================

export async function getApplications(params?: {
  status?: SeatApplicationStatus;
  hall?: string;
  page?: number;
  limit?: number;
}) {
  const res = await api.get<
    ApiResponse<{ applications: RawSeatApplication[]; pagination: Pagination }>
  >("/admission/applications", { params });

  return {
    ...res.data,
    data: {
      applications: (res.data.data?.applications ?? []).map(mapApplication),
      pagination: res.data.data?.pagination,
    },
  };
}

export async function reviewApplication(
  id: string,
  data: { status: Extract<SeatApplicationStatus, "APPROVED" | "REJECTED"> },
) {
  const res = await api.patch<ApiResponse<{ application: SeatApplication }>>(
    `/admission/review/${id}/`,
    data,
  );
  return res.data;
}

export async function createSeatCharge(
  applicationId: string,
  data: { amount: number },
) {
  const res = await api.post<ApiResponse<StudentDue>>(
    `/admission/applications/${applicationId}/seat-charge`,
    data,
  );
  return res.data;
}

export async function allocateSeat(data: {
  applicationId: string;
  roomId: string;
}) {
  const res = await api.post<ApiResponse<{ allocation: SeatAllocation }>>(
    "/admission/allocate",
    data,
  );
  return res.data;
}
