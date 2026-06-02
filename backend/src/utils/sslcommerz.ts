import { STUDENT_URL } from "../Constants.ts";
import ApiError from "./ApiError.ts";

export type SslCommerzConfig = {
  storeId: string;
  storePassword: string;
  baseUrl: string;
  isSandbox: boolean;
};

export type SslCommerzInitParams = {
  tranId: string;
  amount: number;
  productName: string;
  productCategory: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
};

export type SslCommerzInitResult = {
  gatewayUrl: string;
  sessionKey: string;
  tranId: string;
};

export type SslCommerzValidationResult = {
  status: string;
  tranId: string;
  valId: string;
  amount: string;
  storeAmount: string;
  currency: string;
  cardType?: string;
  bankTranId?: string;
};

type RawSslCommerzValidationResult = {
  status?: string;
  tran_id?: string;
  tranId?: string;
  val_id?: string;
  valId?: string;
  amount?: string;
  currency_amount?: string;
  store_amount?: string;
  storeAmount?: string;
  currency?: string;
  card_type?: string;
  cardType?: string;
  bank_tran_id?: string;
  bankTranId?: string;
};

export function getSslCommerzConfig(): SslCommerzConfig {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;

  if (!storeId || !storePassword) {
    throw new ApiError(500, "SSLCommerz credentials are not configured");
  }

  const isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
  const baseUrl = isSandbox
    ? "https://sandbox.sslcommerz.com"
    : "https://securepay.sslcommerz.com";

  return { storeId, storePassword, baseUrl, isSandbox };
}

export function getPaymentCallbackBaseUrl(): string {
  const configured = process.env.API_PUBLIC_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new ApiError(
      500,
      "API_PUBLIC_URL is required in production (public API URL for SSLCommerz IPN and callbacks)"
    );
  }

  const port = process.env.PORT || "8000";
  return `http://localhost:${port}`;
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export async function initiateSslCommerzSession(
  params: SslCommerzInitParams
): Promise<SslCommerzInitResult> {
  const config = getSslCommerzConfig();
  const callbackBase = getPaymentCallbackBaseUrl();

  const body = new URLSearchParams({
    store_id: config.storeId,
    store_passwd: config.storePassword,
    total_amount: formatAmount(params.amount),
    currency: "BDT",
    tran_id: params.tranId,
    success_url: `${callbackBase}/api/payments/sslcommerz/success`,
    fail_url: `${callbackBase}/api/payments/sslcommerz/fail`,
    cancel_url: `${callbackBase}/api/payments/sslcommerz/cancel`,
    ipn_url: `${callbackBase}/api/payments/sslcommerz/ipn`,
    cus_name: params.customer.name,
    cus_email: params.customer.email,
    cus_phone: params.customer.phone,
    cus_add1: params.customer.address,
    cus_city: params.customer.city,
    cus_country: "Bangladesh",
    shipping_method: "NO",
    product_name: params.productName,
    product_category: params.productCategory,
    product_profile: "general",
    num_of_item: "1",
  });

  let response: globalThis.Response;
  try {
    response = await fetch(`${config.baseUrl}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    throw new ApiError(502, "SSLCommerz payment gateway is unavailable");
  }

  const data = (await response.json()) as {
    status?: string;
    failedreason?: string;
    GatewayPageURL?: string;
    sessionkey?: string;
  };

  if (data.status !== "SUCCESS" || !data.GatewayPageURL || !data.sessionkey) {
    throw new ApiError(
      502,
      data.failedreason || "SSLCommerz failed to create a payment session"
    );
  }

  return {
    gatewayUrl: data.GatewayPageURL,
    sessionKey: data.sessionkey,
    tranId: params.tranId,
  };
}

export async function validateSslCommerzPayment(
  valId: string
): Promise<SslCommerzValidationResult> {
  const config = getSslCommerzConfig();
  const url = new URL(`${config.baseUrl}/validator/api/validationserverAPI.php`);
  url.searchParams.set("val_id", valId);
  url.searchParams.set("store_id", config.storeId);
  url.searchParams.set("store_passwd", config.storePassword);
  url.searchParams.set("format", "json");

  let response: globalThis.Response;
  try {
    response = await fetch(url.toString());
  } catch {
    throw new ApiError(502, "SSLCommerz validation service is unavailable");
  }

  const raw = (await response.json()) as RawSslCommerzValidationResult;
  const tranId = raw.tran_id ?? raw.tranId;
  const normalizedValId = raw.val_id ?? raw.valId;
  const amount = raw.amount ?? raw.currency_amount;
  const storeAmount = raw.store_amount ?? raw.storeAmount;

  if (!raw.status || !tranId || !normalizedValId || !amount) {
    throw new ApiError(502, "Invalid response from SSLCommerz validation API");
  }

  return {
    status: raw.status,
    tranId,
    valId: normalizedValId,
    amount,
    storeAmount: storeAmount ?? amount,
    currency: raw.currency ?? "BDT",
    cardType: raw.card_type ?? raw.cardType,
    bankTranId: raw.bank_tran_id ?? raw.bankTranId,
  };
}

export function isSuccessfulSslCommerzStatus(status: string): boolean {
  return status === "VALID" || status === "VALIDATED";
}

const MOBILE_RETURN_PREFIXES = ["hallapp://", "exp://"] as const;

export function isAllowedMobilePaymentReturnUrl(url: string): boolean {
  return MOBILE_RETURN_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export function buildStudentPaymentRedirect(
  outcome: "success" | "failed" | "cancelled",
  tranId?: string,
  returnUrl?: string
): string {
  const params = new URLSearchParams({ payment: outcome });
  if (tranId) {
    params.set("tran_id", tranId);
  }
  const query = params.toString();

  if (returnUrl) {
    if (!isAllowedMobilePaymentReturnUrl(returnUrl)) {
      throw new ApiError(500, "Invalid mobile payment return URL stored on intent");
    }
    const joiner = returnUrl.includes("?") ? "&" : "?";
    return `${returnUrl}${joiner}${query}`;
  }

  if (!STUDENT_URL && process.env.NODE_ENV === "production") {
    throw new ApiError(
      500,
      "STUDENT_URL is required in production (redirect after SSLCommerz payment)"
    );
  }

  const base = (STUDENT_URL || "http://localhost:3001").replace(/\/$/, "");
  return `${base}/dashboard/payments?${query}`;
}
