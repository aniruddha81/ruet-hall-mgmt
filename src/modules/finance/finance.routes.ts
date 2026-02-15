import { Router } from "express";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import {
  createDue,
  createExpense,
  getExpenses,
  getStudentLedger,
  payDue,
} from "./finance.controller";
import {
  createDueSchema,
  createExpenseSchema,
  listExpensesSchema,
  payDueSchema,
  studentLedgerSchema,
} from "./finance.validators";

const financeRouter = Router();

// ==============================================================
// DUES
// ==============================================================

// Create a due for a student
financeRouter.post(
  "/dues",
  authenticateToken,
  authorizeRoles("ASST_FINANCE", "PROVOST"),
  validateRequest(createDueSchema),
  createDue
);

// Mark due as paid
financeRouter.patch(
  "/dues/:id/pay",
  authenticateToken,
  authorizeRoles("ASST_FINANCE", "PROVOST"),
  validateRequest(payDueSchema),
  payDue
);

// ==============================================================
// EXPENSES
// ==============================================================

// Record an expense
financeRouter.post(
  "/expense",
  authenticateToken,
  authorizeRoles("ASST_FINANCE", "PROVOST"),
  validateRequest(createExpenseSchema),
  createExpense
);

// List expenses
financeRouter.get(
  "/expenses",
  authenticateToken,
  authorizeRoles("ASST_FINANCE", "FINANCE_SECTION_OFFICER", "PROVOST"),
  validateRequest(listExpensesSchema),
  getExpenses
);

// ==============================================================
// STUDENT LEDGER
// ==============================================================

// Get student's financial ledger
financeRouter.get(
  "/student/:id/ledger",
  authenticateToken,
  authorizeRoles("ASST_FINANCE", "FINANCE_SECTION_OFFICER", "PROVOST"),
  validateRequest(studentLedgerSchema),
  getStudentLedger
);

export default financeRouter;
