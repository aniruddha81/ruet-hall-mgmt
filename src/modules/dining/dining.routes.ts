import { Router } from "express";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import {
  bookMealTokens,
  cancelMealToken,
  // Dining Manager Controllers
  createTomorrowMenu,
  deleteTomorrowMenu,
  getAllBookingsForMenu,
  getDailyReport,
  getMonthlyReport,
  getMyActiveTokens,
  getMyTokenById,
  getMyTokenHistory,
  getPaymentDetails,
  getTodayMenus,
  getTomorrowBookings,
  // Student Controllers
  getTomorrowMenus,
  getTomorrowMenusList,
  markTokensAsConsumed,
  // Payment Controllers
  processPayment,
  processRefund,
  updateTomorrowMenu,
} from "./dining.controller";

import { validateRequest } from "../../middlewares/validateRequest.middleware";
import {
  bookMealTokensSchema,
  cancelMealTokenSchema,
  createMenuSchema,
  deleteMenuSchema,
  getDailyReportSchema,
  getMenuBookingsSchema,
  getMonthlyReportSchema,
  getPaymentDetailsSchema,
  getTokenByIdSchema,
  getTokenHistorySchema,
  markTokensConsumedSchema,
  processPaymentSchema,
  processRefundSchema,
  updateMenuSchema,
} from "./dining.validators";

const diningRouter = Router();

// ==============================================================
// STUDENT ROUTES - MEAL BOOKING & TOKEN MANAGEMENT
// ==============================================================

// Get tomorrow's lunch and dinner menus for student's hall
diningRouter.get(
  "/tomorrow-menus",
  authenticateToken,
  authorizeRoles("STUDENT"),
  getTomorrowMenus
);

// Book meal tokens for tomorrow
diningRouter.post(
  "/book-tokens",
  validateRequest(bookMealTokensSchema),
  authenticateToken,
  authorizeRoles("STUDENT"),
  bookMealTokens
);

// Get active tokens for tomorrow (can be cancelled)
diningRouter.get(
  "/my-active-tokens",
  authenticateToken,
  authorizeRoles("STUDENT"),
  getMyActiveTokens
);

// Cancel a meal token before midnight
diningRouter.patch(
  "/cancel-token/:tokenId",
  validateRequest(cancelMealTokenSchema),
  authenticateToken,
  authorizeRoles("STUDENT"),
  cancelMealToken
);

// Get student's complete token purchase history with pagination and filters
diningRouter.get(
  "/token-history",
  validateRequest(getTokenHistorySchema),
  authenticateToken,
  authorizeRoles("STUDENT"),
  getMyTokenHistory
);

// Get single token details by ID
diningRouter.get(
  "/token/:tokenId",
  validateRequest(getTokenByIdSchema),
  authenticateToken,
  authorizeRoles("STUDENT"),
  getMyTokenById
);

// ==============================================================
// DINING MANAGER ROUTES - MENU & BOOKING MANAGEMENT
// ==============================================================

// Create menu for tomorrow (lunch or dinner only)
diningRouter.post(
  "/menu/create",
  validateRequest(createMenuSchema),
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  createTomorrowMenu
);

// Update tomorrow's menu details
diningRouter.patch(
  "/menu/:menuId/update",
  validateRequest(updateMenuSchema),
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  updateTomorrowMenu
);

// Delete tomorrow's menu (only if no bookings)
diningRouter.delete(
  "/menu/:menuId",
  validateRequest(deleteMenuSchema),
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  deleteTomorrowMenu
);

// Get tomorrow's created menus (lunch & dinner breakdown)
diningRouter.get(
  "/menus/tomorrow",
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  getTomorrowMenusList
);

// Get today's menus for consumption tracking
diningRouter.get(
  "/menus/today",
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  getTodayMenus
);

// Get all bookings for a specific menu with filters
diningRouter.get(
  "/bookings/menu/:menuId",
  validateRequest(getMenuBookingsSchema),
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  getAllBookingsForMenu
);

// Get all active bookings for tomorrow
diningRouter.get(
  "/bookings/tomorrow",
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  getTomorrowBookings
);

// Mark tokens as consumed during meal service
diningRouter.patch(
  "/tokens/mark-consumed",
  validateRequest(markTokensConsumedSchema),
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  markTokensAsConsumed
);

// Generate daily consumption report
diningRouter.get(
  "/report/daily",
  validateRequest(getDailyReportSchema),
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  getDailyReport
);

// Generate monthly summary report
diningRouter.get(
  "/report/monthly",
  validateRequest(getMonthlyReportSchema),
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  getMonthlyReport
);

// ==============================================================
// PAYMENT ROUTES - SHARED BY STUDENTS & MANAGERS
// ==============================================================

// Process payment for meal token bookings
diningRouter.post(
  "/payment/process",
  validateRequest(processPaymentSchema),
  authenticateToken,
  authorizeRoles("STUDENT"),
  processPayment
);

// Get payment details by payment ID
diningRouter.get(
  "/payment/:paymentId",
  validateRequest(getPaymentDetailsSchema),
  authenticateToken,
  authorizeRoles("STUDENT", "DINING_MANAGER"),
  getPaymentDetails
);

// Process refund for cancelled tokens
diningRouter.post(
  "/payment/:paymentId/refund",
  validateRequest(processRefundSchema),
  authenticateToken,
  authorizeRoles("STUDENT", "DINING_MANAGER"),
  processRefund
);

export default diningRouter;
