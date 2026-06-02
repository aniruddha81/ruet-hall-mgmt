import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { paymentIntents } from "../../db/models/finance.models.ts";
import type {
  DueType,
  FinancePaymentMethod,
  Hall,
  PaymentMethod,
} from "../../types/enums.ts";
import { PAYMENT_METHODS } from "../../types/enums.ts";
import ApiError from "../../utils/ApiError.ts";
import {
  initiateSslCommerzSession,
  isAllowedMobilePaymentReturnUrl,
  isSuccessfulSslCommerzStatus,
  validateSslCommerzPayment,
} from "../../utils/sslcommerz.ts";
import {
  completeMealBooking,
  type MealBookingPayload,
} from "../dining/dining.payment.ts";
import {
  createDuePayment,
  getStudentInfo,
} from "../finance/finance.service.ts";

const SSL_DINING_METHODS = new Set<PaymentMethod>(
  PAYMENT_METHODS.filter((method) => method !== "CASH" && method !== "BANK")
);

export function usesSslCommerzForFinance(method: FinancePaymentMethod): boolean {
  return method === "ONLINE";
}

export function usesSslCommerzForDining(method: PaymentMethod): boolean {
  return SSL_DINING_METHODS.has(method);
}

export type DuePaymentIntentPayload = {
  dueId: string;
  hall: Hall;
  paymentMethod: FinancePaymentMethod;
  dueType: DueType;
  bankReceiptUrl?: string;
};

function buildTranId(prefix: string): string {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 24);
  return `${prefix}${suffix}`.slice(0, 30);
}

function withReturnUrl(
  payload: Record<string, unknown>,
  returnUrl?: string
): Record<string, unknown> {
  return returnUrl ? { ...payload, returnUrl } : payload;
}

function assertValidReturnUrl(returnUrl: string | undefined) {
  if (!returnUrl) {
    return;
  }
  if (!isAllowedMobilePaymentReturnUrl(returnUrl)) {
    throw new ApiError(
      400,
      "returnUrl must use the mobile app scheme (hallapp:// or exp://)"
    );
  }
  if (returnUrl.length > 512) {
    throw new ApiError(400, "returnUrl is too long");
  }
}

export function getReturnUrlFromIntentPayload(
  payload: unknown
): string | undefined {
  if (!payload || typeof payload !== "object" || !("returnUrl" in payload)) {
    return undefined;
  }
  const value = (payload as { returnUrl?: unknown }).returnUrl;
  return typeof value === "string" ? value : undefined;
}

async function createIntent(
  type: "DUE_PAYMENT" | "MEAL_BOOKING",
  studentId: string,
  amount: number,
  payload: Record<string, unknown>,
  returnUrl?: string
) {
  const id = randomUUID();
  const tranId = buildTranId(type === "DUE_PAYMENT" ? "DUE" : "MEAL");

  await db.insert(paymentIntents).values({
    id,
    tranId,
    type,
    status: "PENDING",
    studentId,
    amount,
    payload: withReturnUrl(payload, returnUrl),
  });

  return { id, tranId };
}

export async function initiateDueSslPayment(params: {
  studentId: string;
  dueId: string;
  hall: Hall;
  amount: number;
  paymentMethod: FinancePaymentMethod;
  dueType: DueType;
  returnUrl?: string;
}) {
  assertValidReturnUrl(params.returnUrl);
  const student = await getStudentInfo(params.studentId);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const payload: DuePaymentIntentPayload = {
    dueId: params.dueId,
    hall: params.hall,
    paymentMethod: params.paymentMethod,
    dueType: params.dueType,
  };

  const intent = await createIntent(
    "DUE_PAYMENT",
    params.studentId,
    params.amount,
    payload,
    params.returnUrl
  );

  const session = await initiateSslCommerzSession({
    tranId: intent.tranId,
    amount: params.amount,
    productName: `Hall due (${params.dueType})`,
    productCategory: "Hall Management",
    customer: {
      name: student.name,
      email: student.email,
      phone: "01700000000",
      address: student.hall || "RUET Hall",
      city: "Rajshahi",
    },
  });

  return {
    intentId: intent.id,
    tranId: intent.tranId,
    gatewayUrl: session.gatewayUrl,
    sessionKey: session.sessionKey,
  };
}

export async function initiateMealSslPayment(params: {
  studentId: string;
  menuId: string;
  quantity: number;
  amount: number;
  paymentMethod: PaymentMethod;
  bankReceiptUrl?: string | null;
  returnUrl?: string;
}) {
  assertValidReturnUrl(params.returnUrl);
  const student = await getStudentInfo(params.studentId);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const payload: MealBookingPayload = {
    menuId: params.menuId,
    quantity: params.quantity,
    paymentMethod: params.paymentMethod,
    bankReceiptUrl: params.bankReceiptUrl ?? null,
  };

  const intent = await createIntent(
    "MEAL_BOOKING",
    params.studentId,
    params.amount,
    payload,
    params.returnUrl
  );

  const session = await initiateSslCommerzSession({
    tranId: intent.tranId,
    amount: params.amount,
    productName: "Meal token booking",
    productCategory: "Dining",
    customer: {
      name: student.name,
      email: student.email,
      phone: "01700000000",
      address: student.hall || "RUET Hall",
      city: "Rajshahi",
    },
  });

  return {
    intentId: intent.id,
    tranId: intent.tranId,
    gatewayUrl: session.gatewayUrl,
    sessionKey: session.sessionKey,
  };
}

export async function getIntentByTranId(tranId: string) {
  const [intent] = await db
    .select()
    .from(paymentIntents)
    .where(eq(paymentIntents.tranId, tranId))
    .limit(1);

  return intent ?? null;
}

async function markIntentStatus(
  intentId: string,
  status: "COMPLETED" | "FAILED" | "CANCELLED",
  valId?: string
) {
  await db
    .update(paymentIntents)
    .set({
      status,
      valId: valId ?? null,
      completedAt: new Date(),
    })
    .where(eq(paymentIntents.id, intentId));
}

async function completeIntent(intent: typeof paymentIntents.$inferSelect) {
  if (intent.status === "COMPLETED") {
    return { alreadyCompleted: true as const };
  }

  if (intent.status !== "PENDING") {
    throw new ApiError(400, "Payment intent is no longer pending");
  }

  if (intent.type === "DUE_PAYMENT") {
    const payload = intent.payload as DuePaymentIntentPayload;
    const result = await createDuePayment({
      dueId: payload.dueId,
      studentId: intent.studentId,
      hall: payload.hall,
      amount: intent.amount,
      paymentMethod: payload.paymentMethod,
      dueType: payload.dueType,
      bankReceiptUrl: payload.bankReceiptUrl,
      transactionId: intent.tranId,
    });

    await markIntentStatus(intent.id, "COMPLETED", intent.valId ?? undefined);
    return { alreadyCompleted: false as const, type: "DUE" as const, result };
  }

  const payload = intent.payload as MealBookingPayload;
  const result = await completeMealBooking(
    intent.studentId,
    payload,
    intent.tranId
  );

  await markIntentStatus(intent.id, "COMPLETED", intent.valId ?? undefined);
  return { alreadyCompleted: false as const, type: "MEAL" as const, result };
}

export async function processSslCommerzNotification(body: Record<string, string>) {
  const valId = body.val_id;
  const tranId = body.tran_id;
  const status = body.status?.toUpperCase();

  if (!tranId) {
    return;
  }

  const intent = await getIntentByTranId(tranId);
  if (!intent) {
    return;
  }

  if (intent.status === "COMPLETED") {
    return;
  }

  if (status === "CANCELLED") {
    await markIntentStatus(intent.id, "CANCELLED");
    return;
  }

  if (status === "FAILED" || status === "UNATTEMPTED" || status === "EXPIRED") {
    await markIntentStatus(intent.id, "FAILED");
    return;
  }

  if (!valId) {
    return;
  }

  const validation = await validateSslCommerzPayment(valId);

  if (validation.tranId !== tranId) {
    throw new ApiError(400, "SSLCommerz transaction ID mismatch");
  }

  const validatedAmount = Number(validation.amount);
  if (!Number.isFinite(validatedAmount)) {
    throw new ApiError(400, "SSLCommerz payment amount is invalid");
  }

  if (Math.abs(validatedAmount - intent.amount) > 0.01) {
    throw new ApiError(400, "SSLCommerz payment amount mismatch");
  }

  if (!isSuccessfulSslCommerzStatus(validation.status)) {
    await markIntentStatus(intent.id, "FAILED");
    return;
  }

  await db
    .update(paymentIntents)
    .set({ valId })
    .where(eq(paymentIntents.id, intent.id));

  const refreshed = await getIntentByTranId(tranId);
  if (!refreshed) {
    return;
  }

  await completeIntent({ ...refreshed, valId });
}

export async function processSslCommerzBrowserReturn(
  query: Record<string, string | undefined>,
  outcome: "success" | "failed" | "cancelled"
) {
  const tranId = query.tran_id;
  if (!tranId) {
    throw new ApiError(400, "Missing transaction reference");
  }

  const intent = await getIntentByTranId(tranId);
  if (!intent) {
    throw new ApiError(404, "Payment intent not found");
  }

  if (outcome === "cancelled") {
    if (intent.status === "PENDING") {
      await markIntentStatus(intent.id, "CANCELLED");
    }
    return { tranId, status: "CANCELLED" as const };
  }

  if (outcome === "failed") {
    if (intent.status === "PENDING") {
      await markIntentStatus(intent.id, "FAILED");
    }
    return { tranId, status: "FAILED" as const };
  }

  const valId = query.val_id;
  if (!valId) {
    throw new ApiError(400, "Missing validation reference");
  }

  if (intent.status !== "COMPLETED") {
    await processSslCommerzNotification({
      val_id: valId,
      tran_id: tranId,
      status: query.status || "VALID",
    });
  }

  return { tranId, status: "COMPLETED" as const };
}
