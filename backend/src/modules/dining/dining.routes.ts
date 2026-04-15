import { Router } from "express";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middlewares/auth.middleware.ts";
import { upload } from "../../middlewares/multer.middleware.ts";
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
  processRefund,
  updateTomorrowMenu,
} from "./dining.controller.ts";

import { validateRequest } from "../../middlewares/validateRequest.middleware.ts";
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
  processRefundSchema,
  updateMenuSchema,
} from "./dining.validators.ts";

const diningRouter = Router();

// ==============================================================
// STUDENT ROUTES - MEAL BOOKING & TOKEN MANAGEMENT
// ==============================================================

// Get tomorrow's lunch and dinner menus for student's hall
// /api/v1/dining/tomorrow-menus?hall=HallA
diningRouter.get(
  "/tomorrow-menus",
  authenticateToken,
  authorizeRoles("STUDENT"),
  getTomorrowMenus
);

// Book meal tokens for tomorrow
diningRouter.post(
  "/book-tokens",
  authenticateToken,
  authorizeRoles("STUDENT"),
  upload.single("receiptImage"),
  validateRequest(bookMealTokensSchema),
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
  authenticateToken,
  authorizeRoles("STUDENT"),
  validateRequest(cancelMealTokenSchema),
  cancelMealToken
);

// Get student's complete token purchase history with pagination and filters
diningRouter.get(
  "/token-history",
  authenticateToken,
  authorizeRoles("STUDENT"),
  validateRequest(getTokenHistorySchema),
  getMyTokenHistory
);

// Get single token details by ID
diningRouter.get(
  "/token/:tokenId",
  authenticateToken,
  authorizeRoles("STUDENT"),
  validateRequest(getTokenByIdSchema),
  getMyTokenById
);

// ==============================================================
// DINING MANAGER ROUTES - MENU & BOOKING MANAGEMENT
// ==============================================================

// Create menu for tomorrow (lunch or dinner only)
diningRouter.post(
  "/menu/create",
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  validateRequest(createMenuSchema),
  createTomorrowMenu
);

// Update tomorrow's menu details
diningRouter.patch(
  "/menu/:menuId/update",
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  validateRequest(updateMenuSchema),
  updateTomorrowMenu
);

// Delete tomorrow's menu (only if no bookings)
diningRouter.delete(
  "/menu/:menuId",
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  validateRequest(deleteMenuSchema),
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
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  validateRequest(getMenuBookingsSchema),
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
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  validateRequest(markTokensConsumedSchema),
  markTokensAsConsumed
);

// Generate daily consumption report
diningRouter.get(
  "/report/daily",
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  validateRequest(getDailyReportSchema),
  getDailyReport
);

// Generate monthly summary report
diningRouter.get(
  "/report/monthly",
  authenticateToken,
  authorizeRoles("DINING_MANAGER"),
  validateRequest(getMonthlyReportSchema),
  getMonthlyReport
);

// ==============================================================
// PAYMENT ROUTES - SHARED BY STUDENTS & MANAGERS
// ==============================================================

// Get payment details by payment ID
diningRouter.get(
  "/payment/:paymentId",
  authenticateToken,
  authorizeRoles("STUDENT", "DINING_MANAGER"),
  validateRequest(getPaymentDetailsSchema),
  getPaymentDetails
);

// Process refund for cancelled tokens
diningRouter.post(
  "/payment/:paymentId/refund",
  authenticateToken,
  authorizeRoles("STUDENT", "DINING_MANAGER"),
  validateRequest(processRefundSchema),
  processRefund
);

export default diningRouter;
