import { z } from "zod";
import { DUE_TYPES, FINANCE_PAYMENT_METHODS, HALLS } from "../../types/enums.ts";

// Create a due for a student
export const createDueSchema = {
  body: z.object({
    studentId: z.uuid("Invalid student ID"),
    hall: z.enum(HALLS),
    type: z.enum(DUE_TYPES),
    amount: z.int().positive("Amount must be a positive integer"),
  }),
};

// Mark due as paid
export const payDueSchema = {
  params: z.object({
    id: z.uuid("Invalid due ID"),
  }),
  body: z.object({
    method: z.enum(FINANCE_PAYMENT_METHODS),
  }),
};

// Create expense
export const createExpenseSchema = {
  body: z.object({
    hall: z.enum(HALLS),
    title: z.string().min(3).max(255),
    amount: z.int().positive("Amount must be a positive integer"),
    category: z.string().min(2).max(100),
  }),
};

// List expenses
export const listExpensesSchema = {
  query: z.object({
    hall: z.enum(HALLS).optional(),
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v) : 1))
      .refine((v) => v >= 1, "Page must be at least 1"),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v) : 20))
      .refine((v) => v > 0 && v <= 100, "Limit 1-100"),
  }),
};

// Student ledger
export const studentLedgerSchema = {
  params: z.object({
    id: z.uuid("Invalid student ID"),
  }),
};
