import { randomUUID } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db";
import { users } from "../../db/models";
import {
  expenses,
  payments,
  studentDues,
} from "../../db/models/finance.models";
import type { DueType, FinancePaymentMethod, Hall } from "../../types/enums";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

// ========================
// DUES
// ========================

/**
 * POST /api/v1/finance/dues
 * Admin creates a due for a student
 */
export const createDue = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, hall, type, amount } = req.body;

  // Verify student exists
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, studentId))
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
});

/**
 * PATCH /api/v1/finance/dues/:id/pay
 * Admin marks a due as paid
 */
export const payDue = asyncHandler(async (req: Request, res: Response) => {
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

  // Create payment record
  await db.insert(payments).values({
    id: paymentId,
    studentId: due.studentId,
    hall: due.hall,
    dueId: id,
    amount: due.amount,
    method: method as FinancePaymentMethod,
  });

  // Mark due as paid
  await db
    .update(studentDues)
    .set({ status: "PAID", paidAt: new Date() })
    .where(eq(studentDues.id, id));

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { paymentId, dueId: id, amount: due.amount, method, status: "PAID" },
        "Due paid successfully"
      )
    );
});

// ========================
// EXPENSES
// ========================

/**
 * POST /api/v1/finance/expense
 * Admin records an expense
 */
export const createExpense = asyncHandler(
  async (req: Request, res: Response) => {
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
  }
);

/**
 * GET /api/v1/finance/expenses
 * List expenses with optional hall filter + pagination
 */
export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
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
    .orderBy(sql`${expenses.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
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
});

// ========================
// STUDENT LEDGER
// ========================

/**
 * GET /api/v1/finance/student/:id/ledger
 * Retrieve a student's full financial ledger (dues + payments + summary)
 */
export const getStudentLedger = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const [user] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new ApiError(404, "Student not found");

    const dues = await db
      .select({
        id: studentDues.id,
        type: studentDues.type,
        amount: studentDues.amount,
        status: studentDues.status,
        paidAt: studentDues.paidAt,
        createdAt: studentDues.createdAt,
      })
      .from(studentDues)
      .where(eq(studentDues.studentId, id))
      .orderBy(sql`${studentDues.createdAt} DESC`);

    const studentPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        method: payments.method,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(eq(payments.studentId, id))
      .orderBy(sql`${payments.createdAt} DESC`);

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
          summary: { totalDue, totalPaid },
        },
        "Student ledger retrieved successfully"
      )
    );
  }
);
