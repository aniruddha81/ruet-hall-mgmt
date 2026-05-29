import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { uniStudents } from "../../db/models/auth.models.ts";
import { mealPayments } from "../../db/models/dining.models.ts";
import { payments, studentDues } from "../../db/models/finance.models.ts";
import ApiError from "../../utils/ApiError.ts";
import { sendMail } from "../../utils/email.ts";
import {
  generateReceiptHTML,
  type DueReceiptData,
  type MealReceiptData,
} from "../../utils/receiptTemplate.ts";
import type {
  CreateDuePaymentParams,
  CreateMealPaymentParams,
  DuePaymentResult,
  MealPaymentResult,
} from "./finance.d.ts";

export async function getStudentInfo(studentId: string) {
  const [student] = await db
    .select({
      name: uniStudents.name,
      email: uniStudents.email,
      rollNumber: uniStudents.rollNumber,
      hall: uniStudents.hall,
    })
    .from(uniStudents)
    .where(eq(uniStudents.id, studentId))
    .limit(1);

  return student ?? null;
}

export function sendReceiptEmail(
  receiptData: MealReceiptData | DueReceiptData
): void {
  const html = generateReceiptHTML(receiptData);

  sendMail({
    to: receiptData.studentEmail,
    subject: `Payment Receipt – BDT ${receiptData.amount} (${receiptData.type === "MEAL" ? "Meal Token" : "Hall Due"})`,
    html,
  }).catch((err) => {
    console.error("[Receipt] Email dispatch failed:", err);
  });
}

/**
 * Creates a meal payment record
 * Centralized payment processing for meal tokens
 */
export async function createMealPayment(
  params: CreateMealPaymentParams & { mealType?: string; mealDate?: string }
): Promise<MealPaymentResult> {
  const {
    studentId,
    amount,
    totalQuantity,
    paymentMethod,
    mealType,
    mealDate,
  } = params;

  if (amount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than 0");
  }

  if (totalQuantity <= 0) {
    throw new ApiError(400, "Total quantity must be greater than 0");
  }

  if (paymentMethod !== "CASH") {
    throw new ApiError(
      400,
      "Non-cash meal payments must use the SSLCommerz checkout flow"
    );
  }

  const transactionId = `TXN-MEAL-${studentId}-${Date.now()}`;

  const paymentId = randomUUID();
  const paymentDate = new Date();

  // Create payment record
  await db.insert(mealPayments).values({
    id: paymentId,
    studentId,
    amount,
    totalQuantity,
    paymentMethod,
    transactionId,
  });

  // Generate receipt & email
  getStudentInfo(studentId).then((student) => {
    if (student) {
      sendReceiptEmail({
        type: "MEAL",
        studentName: student.name,
        studentEmail: student.email,
        rollNumber: student.rollNumber,
        hall: student.hall || "N/A",
        paymentId,
        transactionId,
        paymentMethod,
        amount,
        totalQuantity,
        mealType,
        mealDate,
        paymentDate,
      });
    }
  });

  return {
    id: paymentId,
    studentId,
    amount,
    totalQuantity,
    paymentMethod,
    transactionId,
    paymentDate,
  };
}

/**
 * Creates a due payment record and settles the due.
 * Uses atomic conditional UPDATE to prevent double-payment race conditions.
 */
export async function createDuePayment(
  params: CreateDuePaymentParams
): Promise<DuePaymentResult> {
  const {
    dueId,
    studentId,
    hall,
    amount,
    paymentMethod,
    dueType,
    bankReceiptUrl,
    transactionId: providedTransactionId,
  } = params;

  if (amount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than 0");
  }

  if (paymentMethod === "BANK" && !bankReceiptUrl) {
    throw new ApiError(400, "Bank receipt image is required for BANK payments");
  }

  const paymentId = randomUUID();
  const paidAt = new Date();

  // Phase 1: Atomically claim the due + insert payment record.
  // The conditional UPDATE ensures only one concurrent request succeeds.
  await db.transaction(async (trx) => {
    const result = await trx
      .update(studentDues)
      .set({ status: "PAID", paidAt })
      .where(and(eq(studentDues.id, dueId), eq(studentDues.status, "UNPAID")));

    const affectedRows = Array.isArray(result)
      ? (result as any)[0]?.affectedRows
      : (result as any)?.affectedRows;

    if (affectedRows === 0) {
      throw new ApiError(400, "Due is already paid or not found");
    }

    await trx.insert(payments).values({
      id: paymentId,
      studentId,
      hall,
      dueId,
      amount,
      method: paymentMethod,
      bankReceiptUrl: bankReceiptUrl ?? null,
    });
  });

  let transactionId: string;
  if (providedTransactionId) {
    transactionId = providedTransactionId;
  } else if (paymentMethod === "CASH") {
    transactionId = `TXN-DUE-${dueId}-${Date.now()}`;
  } else {
    throw new ApiError(
      400,
      "Online due payments must use the SSLCommerz checkout flow"
    );
  }

  // Generate receipt & email
  getStudentInfo(studentId).then((student) => {
    if (student) {
      sendReceiptEmail({
        type: "DUE",
        studentName: student.name,
        studentEmail: student.email,
        rollNumber: student.rollNumber,
        hall,
        paymentId,
        transactionId,
        paymentMethod,
        amount,
        dueType,
        dueId,
        paidAt,
      });
    }
  });

  return {
    paymentId,
    dueId,
    amount,
    method: paymentMethod,
    status: "PAID",
    transactionId,
    paidAt,
    bankReceiptUrl: bankReceiptUrl ?? null,
    receiptVerifiedAt: null,
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
