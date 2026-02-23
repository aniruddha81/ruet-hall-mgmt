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

// =================== DUES ===================

export async function createDue(data: {
  studentId: string;
  hall: Hall;
  dueType: DueType;
  amount: number;
}) {
  const res = await api.post<ApiResponse<{ due: StudentDue }>>(
    "/finance/dues",
    data,
  );
  return res.data;
}

export async function payDue(
  id: string,
  data: { method: FinancePaymentMethod; amount: number },
) {
  const res = await api.patch<
    ApiResponse<{ due: StudentDue; payment: Payment }>
  >(`/finance/dues/pay/${id}`, data);
  return res.data;
}

// =================== EXPENSES ===================

export async function createExpense(data: {
  title: string;
  amount: number;
  category: string;
}) {
  const res = await api.post<ApiResponse<{ expense: Expense }>>(
    "/finance/expense",
    data,
  );
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
  const res = await api.get<ApiResponse<StudentLedger>>(
    `/finance/student/ledger/${studentId}`,
  );
  return res.data;
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
  const res = await api.get<ApiResponse<{ payment: MealPayment }>>(
    `/finance/meal-payment/${id}`,
  );
  return res.data;
}
