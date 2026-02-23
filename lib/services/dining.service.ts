import api from "@/lib/api";
import type {
  ApiResponse,
  DailyReport,
  MealMenu,
  MealPayment,
  MealToken,
  MealType,
  MonthlyReport,
} from "@/lib/types";

// =================== MENU MANAGEMENT (DINING_MANAGER) ===================

export async function createTomorrowMenu(data: {
  mealType: MealType;
  menuDescription: string;
  price: number;
  totalTokens: number;
}) {
  const res = await api.post<ApiResponse<{ menu: MealMenu }>>(
    "/dining/menu/create",
    data,
  );
  return res.data;
}

export async function updateTomorrowMenu(
  menuId: string,
  data: {
    menuDescription?: string;
    price?: number;
    totalTokens?: number;
  },
) {
  const res = await api.patch<ApiResponse<{ menu: MealMenu }>>(
    `/dining/menu/${menuId}/update`,
    data,
  );
  return res.data;
}

export async function deleteTomorrowMenu(menuId: string) {
  const res = await api.delete<ApiResponse<null>>(`/dining/menu/${menuId}`);
  return res.data;
}

export async function getTomorrowMenusList() {
  const res = await api.get<ApiResponse<{ menus: MealMenu[] }>>(
    "/dining/menus/tomorrow",
  );
  return res.data;
}

export async function getTodayMenus() {
  const res = await api.get<ApiResponse<{ menus: MealMenu[] }>>(
    "/dining/menus/today",
  );
  return res.data;
}

// =================== BOOKING MANAGEMENT ===================

export async function getAllBookingsForMenu(menuId: string) {
  const res = await api.get<ApiResponse<{ bookings: MealToken[] }>>(
    `/dining/bookings/menu/${menuId}`,
  );
  return res.data;
}

export async function getTomorrowBookings() {
  const res = await api.get<ApiResponse<{ bookings: MealToken[] }>>(
    "/dining/bookings/tomorrow",
  );
  return res.data;
}

export async function markTokensAsConsumed(data: { tokenIds: string[] }) {
  const res = await api.patch<ApiResponse<{ updated: number }>>(
    "/dining/tokens/mark-consumed",
    data,
  );
  return res.data;
}

// =================== REPORTS ===================

export async function getDailyReport(date: string) {
  const res = await api.get<ApiResponse<DailyReport>>("/dining/report/daily", {
    params: { date },
  });
  return res.data;
}

export async function getMonthlyReport(month: number, year: number) {
  const res = await api.get<ApiResponse<MonthlyReport>>(
    "/dining/report/monthly",
    { params: { month, year } },
  );
  return res.data;
}

// =================== PAYMENT (shared) ===================

export async function getPaymentDetails(paymentId: string) {
  const res = await api.get<ApiResponse<{ payment: MealPayment }>>(
    `/dining/payment/${paymentId}`,
  );
  return res.data;
}

export async function processRefund(paymentId: string) {
  const res = await api.post<ApiResponse<{ payment: MealPayment }>>(
    `/dining/payment/${paymentId}/refund`,
  );
  return res.data;
}
