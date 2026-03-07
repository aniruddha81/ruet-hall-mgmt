import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { mealPayments } from "../../db/models/dining.models";
import ApiError from "../../utils/ApiError";
import type { CreateMealPaymentParams, MealPaymentResult } from "./finance";
import { PAYMENT_SERVER_URL } from "../../Constants";

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

  let result: { transactionId: string } | undefined = undefined;

  if (paymentMethod !== "CASH") {
    const response = await fetch(`${PAYMENT_SERVER_URL}/pay-api/meal-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ params }),
    });

    result = (await response.json()) as { transactionId: string };
  } else {
    result = {
      transactionId: `TXN-${studentId}-${amount}-${totalQuantity}-CASH-${Date.now()}`,
    };
  }

  const paymentId = randomUUID();

  // Create payment record
  await db.insert(mealPayments).values({
    id: paymentId,
    studentId,
    amount,
    totalQuantity,
    paymentMethod,
    transactionId: result?.transactionId,
  });

  return {
    id: paymentId,
    studentId,
    amount,
    totalQuantity,
    paymentMethod,
    transactionId: result?.transactionId,
    paymentDate: new Date(),
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
