import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { mealPayments } from "../../db/models/dining.models";
import { ApiError } from "../../utils/ApiError";
import type { CreateMealPaymentParams, MealPaymentResult } from "./finance";

/**
 * Creates a meal payment record
 * Centralized payment processing for meal tokens
 */
export async function createMealPayment(
  params: CreateMealPaymentParams
): Promise<MealPaymentResult> {
  const {
    studentId,
    amount,
    totalQuantity,
    paymentMethod,
    transactionId = `TXN-${Date.now()}-${randomUUID().slice(0, 8)}`,
  } = params;

  // Validate amount
  if (amount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than 0");
  }

  // Validate quantity
  if (totalQuantity <= 0) {
    throw new ApiError(400, "Total quantity must be greater than 0");
  }

  // Check for duplicate transaction ID
  if (transactionId) {
    const [existingPayment] = await db
      .select()
      .from(mealPayments)
      .where(eq(mealPayments.transactionId, transactionId))
      .limit(1);

    if (existingPayment) {
      throw new ApiError(409, "Transaction ID already exists");
    }
  }

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
    paymentDate : new Date(),
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
