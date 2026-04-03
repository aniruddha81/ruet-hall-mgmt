import { randomUUID } from "crypto";
import { and, count, desc, eq, sql } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db/index.ts";
import { uniStudents } from "../../db/models/index.ts";
import { mealPayments } from "../../db/models/dining.models.ts";
import {
  expenses,
  payments,
  studentDues,
} from "../../db/models/finance.models.ts";
import type { DueType, FinancePaymentMethod, Hall } from "../../types/enums.ts";
import ApiError from "../../utils/ApiError.ts";
import ApiResponse from "../../utils/ApiResponse.ts";
import { createDuePayment } from "./finance.service.ts";

// ========================
// DUES
// ========================

/**
 * POST /api/v1/finance/dues
 * Admin creates a due for a student
 */
export const createDue = async (req: Request, res: Response) => {
  const { studentId, hall, type, amount } = req.body;

  // Verify student exists
  const [user] = await db
    .select({ id: uniStudents.id })
    .from(uniStudents)
    .where(eq(uniStudents.id, studentId))
    .limit(1);

  if (!user) throw new ApiError(404, "Student not found");

  const id = randomUUID();
  await db.insert(studentDues).values({
    id,
    studentId,
    hall,
    type: type as DueType,
    amount,
  });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { id, studentId, hall, type, amount, status: "UNPAID" },
        "Due created successfully"
      )
    );
};

/**
 * PATCH /api/v1/finance/dues/:id/pay
 * Admin marks a due as paid
 */
export const payDue = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { method } = req.body;

  const [due] = await db
    .select()
    .from(studentDues)
    .where(eq(studentDues.id, id))
    .limit(1);

  if (!due) throw new ApiError(404, "Due not found");
  if (due.status === "PAID") throw new ApiError(400, "Due is already paid");

  const paymentId = randomUUID();

  // Atomic: create payment record + mark due as paid
  await db.transaction(async (trx) => {
    await trx.insert(payments).values({
      id: paymentId,
      studentId: due.studentId,
      hall: due.hall,
      dueId: id,
      amount: due.amount,
      method: method as FinancePaymentMethod,
    });

    await trx
      .update(studentDues)
      .set({ status: "PAID", paidAt: new Date() })
      .where(eq(studentDues.id, id));
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { paymentId, dueId: id, amount: due.amount, method, status: "PAID" },
        "Due paid successfully"
      )
    );
};

/**
 * POST /api/v1/finance/my-dues/pay/:id
 * Student pays one of their own hall dues through the payment gateway
 */
export const payMyDue = async (req: Request, res: Response) => {
  const studentId = req.user!.userId;
  const { id } = req.params as { id: string };
  const { method } = req.body;

  const [due] = await db
    .select()
    .from(studentDues)
    .where(and(eq(studentDues.id, id), eq(studentDues.studentId, studentId)))
    .limit(1);

  if (!due) throw new ApiError(404, "Due not found");
  if (due.status === "PAID") throw new ApiError(400, "Due is already paid");

  const payment = await createDuePayment({
    dueId: due.id,
    studentId: due.studentId,
    hall: due.hall,
    amount: due.amount,
    paymentMethod: method as FinancePaymentMethod,
    dueType: due.type,
  });

  res
    .status(200)
    .json(new ApiResponse(200, payment, "Due paid successfully"));
};

// ========================
// EXPENSES
// ========================

/**
 * POST /api/v1/finance/expense
 * Admin records an expense
 */
export const createExpense = async (req: Request, res: Response) => {
  const { hall, title, amount, category } = req.body;
  const approvedBy = req.user!.userId;

  const id = randomUUID();
  await db
    .insert(expenses)
    .values({ id, hall, title, amount, category, approvedBy });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { id, hall, title, amount, category },
        "Expense recorded successfully"
      )
    );
};

/**
 * GET /api/v1/finance/expenses
 * List expenses with optional hall filter + pagination
 */
export const getExpenses = async (req: Request, res: Response) => {
  const hall = req.query.hall as Hall | undefined;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (hall) conditions.push(eq(expenses.hall, hall));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db
    .select({
      id: expenses.id,
      hall: expenses.hall,
      title: expenses.title,
      amount: expenses.amount,
      category: expenses.category,
      approvedBy: expenses.approvedBy,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .where(whereClause)
    .orderBy(desc(expenses.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: count() })
    .from(expenses)
    .where(whereClause);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        expenses: items,
        pagination: {
          page,
          limit,
          total: countResult?.count || 0,
          totalPages: Math.ceil((countResult?.count || 0) / limit),
        },
      },
      "Expenses retrieved successfully"
    )
  );
};

// ========================
// STUDENT LEDGER
// ========================

/**
 * GET /api/v1/finance/student/:id/ledger
 * Retrieve a student's full financial ledger (dues + payments + summary)
 */
export const getStudentLedger = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const [user] = await db
    .select({ id: uniStudents.id, name: uniStudents.name })
    .from(uniStudents)
    .where(eq(uniStudents.id, id))
    .limit(1);

  if (!user) throw new ApiError(404, "Student not found");

  const dues = await db
    .select({
      id: studentDues.id,
      studentId: studentDues.studentId,
      hall: studentDues.hall,
      type: studentDues.type,
      amount: studentDues.amount,
      status: studentDues.status,
      paidAt: studentDues.paidAt,
      createdAt: studentDues.createdAt,
    })
    .from(studentDues)
    .where(eq(studentDues.studentId, id))
    .orderBy(desc(studentDues.createdAt));

  const studentPayments = await db
    .select({
      id: payments.id,
      hall: payments.hall,
      dueId: payments.dueId,
      amount: payments.amount,
      method: payments.method,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.studentId, id))
    .orderBy(desc(payments.createdAt));

  const mealPaymentsList = await db
    .select({
      id: mealPayments.id,
      amount: mealPayments.amount,
      totalQuantity: mealPayments.totalQuantity,
      paymentMethod: mealPayments.paymentMethod,
      transactionId: mealPayments.transactionId,
      paymentDate: mealPayments.paymentDate,
      refundAmount: mealPayments.refundAmount,
      refundedAt: mealPayments.refundedAt,
    })
    .from(mealPayments)
    .where(eq(mealPayments.studentId, id))
    .orderBy(desc(mealPayments.paymentDate));

  const totalDue = dues
    .filter((d) => d.status === "UNPAID")
    .reduce((sum, d) => sum + d.amount, 0);

  const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        student: user,
        dues,
        payments: studentPayments,
        mealPayments: mealPaymentsList,
        summary: { totalDue, totalPaid },
      },
      "Student ledger retrieved successfully"
    )
  );
};

// ========================
// MEAL PAYMENTS
// ========================

/**
 * GET /api/v1/finance/meal-payments
 * Get all meal payments with filters (for finance officers)
 */
export const getMealPayments = async (req: Request, res: Response) => {
  const { studentId, startDate, endDate, page = 1, limit = 20 } = req.query;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (studentId)
    conditions.push(eq(mealPayments.studentId, studentId as string));
  if (startDate)
    conditions.push(
      sql`${mealPayments.paymentDate} >= CAST(${startDate} AS DATE)`
    );
  if (endDate)
    conditions.push(
      sql`${mealPayments.paymentDate} <= CAST(${endDate} AS DATE)`
    );

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const paymentsList = await db
    .select({
      id: mealPayments.id,
      studentId: mealPayments.studentId,
      studentName: uniStudents.name,
      rollNumber: uniStudents.rollNumber,
      amount: mealPayments.amount,
      totalQuantity: mealPayments.totalQuantity,
      paymentMethod: mealPayments.paymentMethod,
      transactionId: mealPayments.transactionId,
      paymentDate: mealPayments.paymentDate,
      refundAmount: mealPayments.refundAmount,
      refundedAt: mealPayments.refundedAt,
    })
    .from(mealPayments)
    .innerJoin(uniStudents, eq(mealPayments.studentId, uniStudents.id))
    .where(whereClause)
    .orderBy(desc(mealPayments.paymentDate))
    .limit(limitNum)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(mealPayments)
    .where(whereClause);

  const total = countResult?.count || 0;
  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        payments: paymentsList,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      },
      "Meal payments retrieved successfully"
    )
  );
};

/**
 * GET /api/v1/finance/meal-payment/:id
 * Get specific meal payment details
 */
export const getMealPaymentById = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const [payment] = await db
    .select({
      id: mealPayments.id,
      studentId: mealPayments.studentId,
      studentName: uniStudents.name,
      studentEmail: uniStudents.email,
      rollNumber: uniStudents.rollNumber,
      amount: mealPayments.amount,
      totalQuantity: mealPayments.totalQuantity,
      paymentMethod: mealPayments.paymentMethod,
      transactionId: mealPayments.transactionId,
      paymentDate: mealPayments.paymentDate,
      refundAmount: mealPayments.refundAmount,
      refundedAt: mealPayments.refundedAt,
    })
    .from(mealPayments)
    .innerJoin(uniStudents, eq(mealPayments.studentId, uniStudents.id))
    .where(eq(mealPayments.id, id))
    .limit(1);

  if (!payment) {
    throw new ApiError(404, "Meal payment not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        payment,
        "Meal payment details retrieved successfully"
      )
    );
};

/**
 * GET /api/v1/finance/meal-payments/report
 * Generate meal payment revenue report
 */
export const getMealPaymentsReport = async (req: Request, res: Response) => {
  const { startDate, endDate, hall } = req.query;

  const conditions = [];
  if (startDate)
    conditions.push(
      sql`${mealPayments.paymentDate} >= CAST(${startDate} AS DATE)`
    );
  if (endDate)
    conditions.push(
      sql`${mealPayments.paymentDate} <= CAST(${endDate} AS DATE)`
    );
  if (hall) conditions.push(eq(uniStudents.hall, hall as Hall));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [summary] = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(${mealPayments.amount}), 0)`,
      totalRefunded: sql<number>`COALESCE(SUM(${mealPayments.refundAmount}), 0)`,
      totalTokensSold: sql<number>`COALESCE(SUM(${mealPayments.totalQuantity}), 0)`,
      totalTransactions: sql<number>`COUNT(${mealPayments.id})`,
    })
    .from(mealPayments)
    .leftJoin(uniStudents, eq(mealPayments.studentId, uniStudents.id))
    .where(whereClause);

  const paymentMethodBreakdown = await db
    .select({
      paymentMethod: mealPayments.paymentMethod,
      count: sql<number>`COUNT(*)`,
      totalAmount: sql<number>`COALESCE(SUM(${mealPayments.amount}), 0)`,
    })
    .from(mealPayments)
    .leftJoin(uniStudents, eq(mealPayments.studentId, uniStudents.id))
    .where(whereClause)
    .groupBy(mealPayments.paymentMethod);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        summary: {
          totalRevenue: Number(summary?.totalRevenue || 0),
          totalRefunded: Number(summary?.totalRefunded || 0),
          netRevenue:
            Number(summary?.totalRevenue || 0) -
            Number(summary?.totalRefunded || 0),
          totalTokensSold: Number(summary?.totalTokensSold || 0),
          totalTransactions: Number(summary?.totalTransactions || 0),
        },
        paymentMethodBreakdown: paymentMethodBreakdown.map((item) => ({
          method: item.paymentMethod,
          count: Number(item.count),
          totalAmount: Number(item.totalAmount),
        })),
      },
      "Meal payments report generated successfully"
    )
  );
};

// ========================
// STUDENT-FACING FINANCE
// ========================

/**
 * GET /api/v1/finance/my-dues
 * Student views their own dues
 */
export const getMyDues = async (req: Request, res: Response) => {
  const studentId = req.user!.userId;

  const dues = await db
    .select({
      id: studentDues.id,
      studentId: studentDues.studentId,
      type: studentDues.type,
      hall: studentDues.hall,
      amount: studentDues.amount,
      status: studentDues.status,
      paidAt: studentDues.paidAt,
      createdAt: studentDues.createdAt,
    })
    .from(studentDues)
    .where(eq(studentDues.studentId, studentId))
    .orderBy(desc(studentDues.createdAt));

  const totalUnpaid = dues
    .filter((d) => d.status === "UNPAID")
    .reduce((sum, d) => sum + d.amount, 0);

  res
    .status(200)
    .json(
      new ApiResponse(200, { dues, totalUnpaid }, "Dues retrieved successfully")
    );
};

/**
 * GET /api/v1/finance/my-ledger
 * Student views their own financial ledger
 */
export const getMyLedger = async (req: Request, res: Response) => {
  const studentId = req.user!.userId;

  const dues = await db
    .select({
      id: studentDues.id,
      studentId: studentDues.studentId,
      type: studentDues.type,
      hall: studentDues.hall,
      amount: studentDues.amount,
      status: studentDues.status,
      paidAt: studentDues.paidAt,
      createdAt: studentDues.createdAt,
    })
    .from(studentDues)
    .where(eq(studentDues.studentId, studentId))
    .orderBy(desc(studentDues.createdAt));

  const studentPayments = await db
    .select({
      id: payments.id,
      hall: payments.hall,
      dueId: payments.dueId,
      amount: payments.amount,
      method: payments.method,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.studentId, studentId))
    .orderBy(desc(payments.createdAt));

  const mealPaymentsList = await db
    .select({
      id: mealPayments.id,
      amount: mealPayments.amount,
      totalQuantity: mealPayments.totalQuantity,
      paymentMethod: mealPayments.paymentMethod,
      transactionId: mealPayments.transactionId,
      paymentDate: mealPayments.paymentDate,
      refundAmount: mealPayments.refundAmount,
      refundedAt: mealPayments.refundedAt,
    })
    .from(mealPayments)
    .where(eq(mealPayments.studentId, studentId))
    .orderBy(desc(mealPayments.paymentDate));

  const totalDue = dues
    .filter((d) => d.status === "UNPAID")
    .reduce((sum, d) => sum + d.amount, 0);

  const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        dues,
        payments: studentPayments,
        mealPayments: mealPaymentsList,
        summary: { totalDue, totalPaid },
      },
      "Ledger retrieved successfully"
    )
  );
};
