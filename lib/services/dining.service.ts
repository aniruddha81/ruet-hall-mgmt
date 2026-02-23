import api from "@/lib/api";
import type {
  ApiResponse,
  MealMenu,
  MealPayment,
  MealToken,
} from "@/lib/types";

// =================== STUDENT DINING ===================

export async function getTomorrowMenus(hall: string) {
  const res = await api.get<ApiResponse<{ menus: MealMenu[] }>>(
    "/dining/tomorrow-menus",
    { params: { hall } },
  );
  return res.data;
}

export async function bookMealTokens(data: {
  menuId: string;
  quantity: number;
}) {
  const res = await api.post<ApiResponse<{ token: MealToken }>>(
    "/dining/book-tokens",
    data,
  );
  return res.data;
}

export async function getMyActiveTokens() {
  const res = await api.get<ApiResponse<{ tokens: MealToken[] }>>(
    "/dining/my-active-tokens",
  );
  return res.data;
}

export async function cancelMealToken(tokenId: string) {
  const res = await api.patch<ApiResponse<{ token: MealToken }>>(
    `/dining/cancel-token/${tokenId}`,
  );
  return res.data;
}

export async function getMyTokenHistory(params?: {
  page?: number;
  limit?: number;
}) {
  const res = await api.get<
    ApiResponse<{ tokens: MealToken[]; pagination: unknown }>
  >("/dining/token-history", { params });
  return res.data;
}

export async function getMyTokenById(tokenId: string) {
  const res = await api.get<ApiResponse<{ token: MealToken }>>(
    `/dining/token/${tokenId}`,
  );
  return res.data;
}

// =================== STUDENT DINING PAYMENTS ===================

export async function processPayment(data: {
  tokenIds: string[];
  paymentMethod: string;
  transactionId: string;
}) {
  const res = await api.post<ApiResponse<{ payment: MealPayment }>>(
    "/dining/payment/process",
    data,
  );
  return res.data;
}

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
