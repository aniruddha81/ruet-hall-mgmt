import api from "@/lib/api";
import type {
  ApiResponse,
  MealBookingReceipt,
  MealMenu,
  MealPayment,
  MealToken,
  Pagination,
  PaymentMethod,
} from "@/lib/types";

type RawMealToken = {
  tokenId?: string;
  id?: string;
  studentId?: string;
  menuId?: string;
  hall?: MealToken["hall"];
  quantity: number;
  totalAmount: number;
  mealType: MealToken["mealType"];
  mealDate: string;
  bookingTime?: string;
  cancelledAt?: string | null;
  paymentId?: string | null;
  menuDescription?: string;
  price?: number;
};

function mapMealToken(raw: RawMealToken): MealToken {
  return {
    id: raw.id ?? raw.tokenId ?? "",
    studentId: raw.studentId ?? "",
    menuId: raw.menuId ?? "",
    hall: raw.hall,
    mealDate: raw.mealDate,
    mealType: raw.mealType,
    quantity: raw.quantity,
    totalAmount: raw.totalAmount,
    paymentId: raw.paymentId ?? null,
    bookingTime: raw.bookingTime ?? "",
    cancelledAt: raw.cancelledAt ?? null,
    status: raw.cancelledAt ? "CANCELLED" : "ACTIVE",
    menuDescription: raw.menuDescription,
    price: raw.price,
  };
}

// =================== STUDENT DINING ===================

export async function getTomorrowMenus() {
  const res = await api.get<ApiResponse<{ lunch?: MealMenu[]; dinner?: MealMenu[] }>>(
    "/dining/tomorrow-menus",
  );

  const menus = res.data.data ?? {};

  return {
    ...res.data,
    data: {
      menus: {
        lunch: menus.lunch ?? [],
        dinner: menus.dinner ?? [],
      },
    },
  };
}

export async function bookMealTokens(data: {
  menuId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
}) {
  const res = await api.post<ApiResponse<MealBookingReceipt>>(
    "/dining/book-tokens",
    data,
  );
  return res.data;
}

export async function getMyActiveTokens() {
  const res = await api.get<ApiResponse<RawMealToken[]>>(
    "/dining/my-active-tokens",
  );

  return {
    ...res.data,
    data: {
      tokens: (res.data.data ?? []).map(mapMealToken),
    },
  };
}

export async function cancelMealToken(tokenId: string) {
  const res = await api.patch<ApiResponse<{ tokenId: string }>>(
    `/dining/cancel-token/${tokenId}`,
  );
  return res.data;
}

export async function getMyTokenHistory(params?: {
  page?: number;
  limit?: number;
}) {
  const res = await api.get<
    ApiResponse<{ tokens: RawMealToken[]; pagination: Pagination }>
  >("/dining/token-history", { params });

  return {
    ...res.data,
    data: {
      tokens: (res.data.data?.tokens ?? []).map(mapMealToken),
      pagination: res.data.data?.pagination,
    },
  };
}

export async function getMyTokenById(tokenId: string) {
  const res = await api.get<ApiResponse<RawMealToken & { paymentMethod?: MealPayment["paymentMethod"]; transactionId?: string }>>(
    `/dining/token/${tokenId}`,
  );

  return {
    ...res.data,
    data: {
      token: mapMealToken(res.data.data),
    },
  };
}

