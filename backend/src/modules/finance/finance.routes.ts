import { Router } from "express";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middlewares/auth.middleware.ts";
import { validateRequest } from "../../middlewares/validateRequest.middleware.ts";
import {
  createDue,
  createExpense,
  getExpenses,
  getMealPaymentById,
  getMealPayments,
  getMealPaymentsReport,
  getMyDues,
  getMyLedger,
  getStudentLedger,
  payDue,
  payMyDue,
} from "./finance.controller.ts";
import {
  createDueSchema,
  createExpenseSchema,
  listExpensesSchema,
  payDueSchema,
  payMyDueSchema,
  studentLedgerSchema,
} from "./finance.validators.ts";

const financeRouter = Router();

// ==============================================================
// STUDENT-FACING ROUTES
// ==============================================================

// Student views their own dues
financeRouter.get(
  "/my-dues",
  authenticateToken,
  authorizeRoles("STUDENT"),
  getMyDues
);

// Student pays one of their own dues
financeRouter.post(
  "/my-dues/pay/:id",
  authenticateToken,
  authorizeRoles("STUDENT"),
  validateRequest(payMyDueSchema),
  payMyDue
);

// Student views their own financial ledger
financeRouter.get(
  "/my-ledger",
  authenticateToken,
  authorizeRoles("STUDENT"),
  getMyLedger
);

// ==============================================================
// DUES
// ==============================================================

// Create a due for a student
financeRouter.post(
  "/dues",
  authenticateToken,
  authorizeRoles("ASST_FINANCE"),
  validateRequest(createDueSchema),
  createDue
);

// Mark due as paid
financeRouter.patch(
  "/dues/pay/:id",
  authenticateToken,
  authorizeRoles("ASST_FINANCE"),
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
  authorizeRoles("ASST_FINANCE"),
  validateRequest(createExpenseSchema),
  createExpense
);

// List expenses
financeRouter.get(
  "/expenses",
  authenticateToken,
  authorizeRoles("ASST_FINANCE", "FINANCE_SECTION_OFFICER"),
  validateRequest(listExpensesSchema),
  getExpenses
);

// ==============================================================
// STUDENT LEDGER
// ==============================================================

// Get student's financial ledger
financeRouter.get(
  "/student/ledger/:id",
  authenticateToken,
  authorizeRoles("ASST_FINANCE", "FINANCE_SECTION_OFFICER"),
  validateRequest(studentLedgerSchema),
  getStudentLedger
);

// ==============================================================
// MEAL PAYMENTS
// ==============================================================

// Get all meal payments with filters
financeRouter.get(
  "/meal-payments",
  authenticateToken,
  authorizeRoles("ASST_FINANCE", "FINANCE_SECTION_OFFICER"),
  getMealPayments
);

// Get meal payments report
financeRouter.get(
  "/meal-payments/report",
  authenticateToken,
  authorizeRoles("ASST_FINANCE", "FINANCE_SECTION_OFFICER"),
  getMealPaymentsReport
);

// Get specific meal payment
financeRouter.get(
  "/meal-payment/:id",
  authenticateToken,
  authorizeRoles("ASST_FINANCE", "FINANCE_SECTION_OFFICER"),
  getMealPaymentById
);

export default financeRouter;
