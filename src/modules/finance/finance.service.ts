import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { PAYMENT_SERVER_URL } from "../../Constants.ts";
import { db } from "../../db/index.ts";
import { mealPayments } from "../../db/models/dining.models.ts";
import { payments, studentDues } from "../../db/models/finance.models.ts";
import ApiError from "../../utils/ApiError.ts";
import type {
  CreateDuePaymentParams,
  CreateMealPaymentParams,
  DuePaymentResult,
  MealPaymentResult,
} from "./finance.d.ts";

type DummyGatewayResponse = {
  data?: {
    transactionId?: string;
  };
  transactionId?: string;
};

async function requestDummyPayment(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<string> {
  let response: globalThis.Response;

  try {
    response = await fetch(`${PAYMENT_SERVER_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError(502, "Dummy payment server is unavailable");
  }

  if (!response.ok) {
    throw new ApiError(502, "Dummy payment server rejected the payment");
  }

  const payloadData = (await response.json()) as DummyGatewayResponse;
  const transactionId =
    payloadData.data?.transactionId ?? payloadData.transactionId;

  if (!transactionId) {
    throw new ApiError(502, "Dummy payment server did not return a transaction ID");
  }

  return transactionId;
}

/**
 * Creates a meal payment record
 * Centralized payment processing for meal tokens
 */
export async function createMealPayment(
  params: CreateMealPaymentParams
): Promise<MealPaymentResult> {
  const { studentId, amount, totalQuantity, paymentMethod } = params;

  // Validate amount
  if (amount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than 0");
  }

  // Validate quantity
  if (totalQuantity <= 0) {
    throw new ApiError(400, "Total quantity must be greater than 0");
  }

  const transactionId =
    paymentMethod !== "CASH"
      ? await requestDummyPayment("/pay-api/meal-payment", {
          studentId,
          amount,
          totalQuantity,
          paymentMethod,
        })
      : `TXN-MEAL-${studentId}-${Date.now()}`;

  const paymentId = randomUUID();

  // Create payment record
  await db.insert(mealPayments).values({
    id: paymentId,
    studentId,
    amount,
    totalQuantity,
    paymentMethod,
    transactionId,
  });

  return {
    id: paymentId,
    studentId,
    amount,
    totalQuantity,
    paymentMethod,
    transactionId,
    paymentDate: new Date(),
  };
}

/**
 * Creates a due payment record and settles the due
 */
export async function createDuePayment(
  params: CreateDuePaymentParams
): Promise<DuePaymentResult> {
  const { dueId, studentId, hall, amount, paymentMethod, dueType } = params;

  if (amount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than 0");
  }

  const transactionId =
    paymentMethod !== "CASH"
      ? await requestDummyPayment("/pay-api/hall-charge-payment", {
          dueId,
          studentId,
          hall,
          amount,
          paymentMethod,
          chargeType: dueType,
        })
      : `TXN-DUE-${dueId}-${Date.now()}`;

  const paymentId = randomUUID();
  const paidAt = new Date();

  await db.transaction(async (trx) => {
    await trx.insert(payments).values({
      id: paymentId,
      studentId,
      hall,
      dueId,
      amount,
      method: paymentMethod,
    });

    await trx
      .update(studentDues)
      .set({ status: "PAID", paidAt })
      .where(eq(studentDues.id, dueId));
  });

  return {
    paymentId,
    dueId,
    amount,
    method: paymentMethod,
    status: "PAID",
    transactionId,
    paidAt,
  };
}

/**
 * Process refund for a meal payment
 */
export async function processMealPaymentRefund(
  paymentId: string,
  refundAmount: number
): Promise<void> {
  const [payment] = await db
    .select()
    .from(mealPayments)
    .where(eq(mealPayments.id, paymentId))
    .limit(1);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  if (payment.refundedAt) {
    throw new ApiError(400, "Refund has already been processed");
  }

  const currentRefundTotal = (payment.refundAmount || 0) + refundAmount;
  if (currentRefundTotal > payment.amount) {
    throw new ApiError(
      400,
      `Refund amount exceeds payment amount. Maximum refundable: ${
        payment.amount - (payment.refundAmount || 0)
      }`
    );
  }

  await db
    .update(mealPayments)
    .set({
      refundAmount: currentRefundTotal,
      refundedAt: new Date(),
    })
    .where(eq(mealPayments.id, paymentId));
}
