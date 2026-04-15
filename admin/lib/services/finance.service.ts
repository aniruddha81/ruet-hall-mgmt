import api from "@/lib/api";
import type {
  ApiResponse,
  DueType,
  Expense,
  FinancePaymentMethod,
  Hall,
  MealPayment,
  Payment,
  StudentDue,
  StudentLedger,
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
  bankReceiptUrl?: string | null;
  receiptVerifiedAt?: string | null;
  receiptVerifiedBy?: string | null;
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
    bankReceiptUrl: raw.bankReceiptUrl,
    receiptVerifiedAt: raw.receiptVerifiedAt,
    receiptVerifiedBy: raw.receiptVerifiedBy,
    createdAt: raw.createdAt,
  };
}

// =================== DUES ===================

export async function createDue(data: {
  studentId: string;
  hall: Hall;
  dueType: DueType;
  amount: number;
}) {
  const res = await api.post<ApiResponse<RawStudentDue>>("/finance/dues", {
    studentId: data.studentId,
    hall: data.hall,
    type: data.dueType,
    amount: data.amount,
  });

  return {
    ...res.data,
    data: mapDue(res.data.data),
  };
}

export async function payDue(
  id: string,
  data: { method: FinancePaymentMethod; receiptImage?: File | null },
) {
  if (data.method === "BANK") {
    if (!data.receiptImage) {
      throw new Error("Bank receipt image is required for BANK payments");
    }

    const formData = new FormData();
    formData.append("method", data.method);
    formData.append("receiptImage", data.receiptImage);

    const res = await api.patch<ApiResponse<{ paymentId: string }>>(
      `/finance/dues/pay/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res.data;
  }

  const res = await api.patch<ApiResponse<{ paymentId: string }>>(
    `/finance/dues/pay/${id}`,
    { method: data.method },
  );
  return res.data;
}

// =================== EXPENSES ===================

export async function createExpense(data: {
  hall: Hall;
  title: string;
  amount: number;
  category: string;
}) {
  const res = await api.post<ApiResponse<Expense>>("/finance/expense", data);
  return res.data;
}

export async function getExpenses(params?: {
  hall?: Hall;
  page?: number;
  limit?: number;
}) {
  const res = await api.get<ApiResponse<{ expenses: Expense[] }>>(
    "/finance/expenses",
    { params },
  );
  return res.data;
}

// =================== STUDENT LEDGER ===================

export async function getStudentLedger(studentId: string) {
  const res = await api.get<
    ApiResponse<{
      student?: StudentLedger["student"];
      dues: RawStudentDue[];
      payments: RawPayment[];
      mealPayments: MealPayment[];
      summary?: StudentLedger["summary"];
    }>
  >(`/finance/student/ledger/${studentId}`);

  const data = res.data.data;

  return {
    ...res.data,
    data: {
      student: data?.student,
      dues: (data?.dues ?? []).map(mapDue),
      payments: (data?.payments ?? []).map(mapPayment),
      mealPayments: data?.mealPayments ?? [],
      summary: data?.summary,
    } satisfies StudentLedger,
  };
}

// =================== MEAL PAYMENTS ===================

export async function getMealPayments() {
  const res = await api.get<ApiResponse<{ payments: MealPayment[] }>>(
    "/finance/meal-payments",
  );
  return res.data;
}

export async function getMealPaymentsReport() {
  const res = await api.get<ApiResponse<unknown>>(
    "/finance/meal-payments/report",
  );
  return res.data;
}

export async function getMealPaymentById(id: string) {
  const res = await api.get<ApiResponse<MealPayment>>(
    `/finance/meal-payment/${id}`,
  );
  return res.data;
}

export async function verifyPaymentReceipt(id: string) {
  const res = await api.patch<
    ApiResponse<{
      id: string;
      receiptVerifiedAt: string;
      receiptVerifiedBy: string;
    }>
  >(`/finance/payments/${id}/verify-receipt`);
  return res.data;
}

export async function verifyMealPaymentReceipt(id: string) {
  const res = await api.patch<
    ApiResponse<{
      id: string;
      receiptVerifiedAt: string;
      receiptVerifiedBy: string;
    }>
  >(`/finance/meal-payment/${id}/verify-receipt`);
  return res.data;
}
