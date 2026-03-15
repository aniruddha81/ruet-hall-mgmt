import api from "@/lib/api";
import type {
  AcademicDepartment,
  ApiResponse,
  Hall,
  SeatApplication,
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

// =================== STUDENT ADMISSION ===================

export async function applyForSeat(data: {
  hall: Hall;
  academicDepartment: AcademicDepartment;
  session: string;
}) {
  const res = await api.post<ApiResponse<SeatApplication>>(
    "/admission/apply",
    data,
  );
  return res.data;
}

export async function getMyApplicationStatus() {
  const res = await api.get<ApiResponse<RawSeatApplication | null>>(
    "/admission/my-status",
  );

  return {
    ...res.data,
    data: res.data.data ? mapApplication(res.data.data) : null,
  };
}
