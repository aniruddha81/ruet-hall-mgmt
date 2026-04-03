import api from "@/lib/api";
import type {
  ApiResponse,
  DuePaymentReceipt,
  MealPayment,
  Payment,
  StudentDue,
  StudentLedger,
  FinancePaymentMethod,
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

type RawPayment = {
  id: string;
  studentId?: string;
  hall: Payment["hall"];
  dueId: string | null;
  amount: number;
  method: Payment["method"];
  createdAt: string;
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

function mapPayment(raw: RawPayment): Payment {
  return {
    id: raw.id,
    studentId: raw.studentId,
    hall: raw.hall,
    dueId: raw.dueId,
    amount: raw.amount,
    method: raw.method,
    createdAt: raw.createdAt,
  };
}

// =================== STUDENT FINANCE ===================

export async function getMyDues() {
  const res =
    await api.get<ApiResponse<{ dues: RawStudentDue[]; totalUnpaid: number }>>(
      "/finance/my-dues",
    );

  return {
    ...res.data,
    data: {
      dues: (res.data.data?.dues ?? []).map(mapDue),
      totalUnpaid: res.data.data?.totalUnpaid ?? 0,
    },
  };
}

export async function payMyDue(
  dueId: string,
  data: { method: FinancePaymentMethod },
) {
  const res = await api.post<ApiResponse<DuePaymentReceipt>>(
    `/finance/my-dues/pay/${dueId}`,
    data,
  );
  return res.data;
}

export async function getMyLedger() {
  const res = await api.get<
    ApiResponse<{
      dues: RawStudentDue[];
      payments: RawPayment[];
      mealPayments: MealPayment[];
      summary: { totalDue: number; totalPaid: number };
    }>
  >("/finance/my-ledger");

  const data = res.data.data;

  return {
    ...res.data,
    data: {
      dues: (data?.dues ?? []).map(mapDue),
      payments: (data?.payments ?? []).map(mapPayment),
      mealPayments: data?.mealPayments ?? [],
      summary: data?.summary ?? { totalDue: 0, totalPaid: 0 },
    } satisfies StudentLedger,
  };
}
