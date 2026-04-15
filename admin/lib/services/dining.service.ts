import api from "@/lib/api";
import type {
  ApiResponse,
  DailyReport,
  DiningDateRangeSalesReport,
  MealItem,
  MealMenu,
  MealPayment,
  MealToken,
  MealType,
  MonthlyReport,
} from "@/lib/types";

// =================== MENU MANAGEMENT (DINING_MANAGER) ===================

export async function createTomorrowMenu(data: {
  mealType: MealType;
  mealItemIds: string[];
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
    mealItemIds?: string[];
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
  const res = await api.get<ApiResponse<Array<MealMenu & { menuId?: string }>>>(
    "/dining/menus/tomorrow",
  );

  const rawMenus = Array.isArray(res.data.data)
    ? res.data.data
    : ((
        res.data.data as
          | { menus?: Array<MealMenu & { menuId?: string }> }
          | undefined
      )?.menus ?? []);

  const menus = rawMenus.map((menu) => ({
    ...menu,
    id: menu.id ?? menu.menuId,
  }));

  return {
    ...res.data,
    data: { menus },
  };
}

export async function getTodayMenus() {
  const res = await api.get<ApiResponse<Array<MealMenu & { menuId?: string }>>>(
    "/dining/menus/today",
  );

  const rawMenus = Array.isArray(res.data.data)
    ? res.data.data
    : ((
        res.data.data as
          | { menus?: Array<MealMenu & { menuId?: string }> }
          | undefined
      )?.menus ?? []);

  const menus = rawMenus.map((menu) => ({
    ...menu,
    id: menu.id ?? menu.menuId,
  }));

  return {
    ...res.data,
    data: { menus },
  };
}

export async function getMealItems() {
  const res =
    await api.get<ApiResponse<{ items: MealItem[] }>>("/dining/meal-items");
  return res.data;
}

export async function createMealItem(data: { name: string }) {
  const res = await api.post<ApiResponse<{ id: string; name: string }>>(
    "/dining/meal-items",
    data,
  );
  return res.data;
}

export async function updateMealItem(
  itemId: string,
  data: { name?: string; isActive?: boolean },
) {
  const res = await api.patch<ApiResponse<{ id: string }>>(
    `/dining/meal-items/${itemId}`,
    data,
  );
  return res.data;
}

export async function deleteMealItem(itemId: string) {
  const res = await api.delete<ApiResponse<{ id: string }>>(
    `/dining/meal-items/${itemId}`,
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

export async function getDateRangeSalesReport(
  startDate: string,
  endDate: string,
) {
  const res = await api.get<ApiResponse<DiningDateRangeSalesReport>>(
    "/dining/report/range",
    {
      params: { startDate, endDate },
    },
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
