import { Router } from "express";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middlewares/auth.middleware.ts";
import { upload } from "../../middlewares/multer.middleware.ts";
import {
  bookMealTokens,
  cancelMealToken,
  createMealItem,
  // Dining Manager Controllers
  createTomorrowMenu,
  deleteMealItem,
  deleteTomorrowMenu,
  getAllBookingsForMenu,
  getDailyReport,
  getDateRangeSalesReport,
  getMealItems,
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
  updateMealItem,
  updateTomorrowMenu,
} from "./dining.controller.ts";

import { validateRequest } from "../../middlewares/validateRequest.middleware.ts";
import {
  bookMealTokensSchema,
  cancelMealTokenSchema,
  createMealItemSchema,
  createMenuSchema,
  deleteMealItemSchema,
  deleteMenuSchema,
  getDailyReportSchema,
  getDateRangeSalesReportSchema,
  getMenuBookingsSchema,
  getMonthlyReportSchema,
  getPaymentDetailsSchema,
  getTokenByIdSchema,
  getTokenHistorySchema,
  markTokensConsumedSchema,
  processRefundSchema,
  updateMealItemSchema,
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
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  validateRequest(createMenuSchema),
  createTomorrowMenu
);

// Update tomorrow's menu details
diningRouter.patch(
  "/menu/:menuId/update",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  validateRequest(updateMenuSchema),
  updateTomorrowMenu
);

// Delete tomorrow's menu (only if no bookings)
diningRouter.delete(
  "/menu/:menuId",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  validateRequest(deleteMenuSchema),
  deleteTomorrowMenu
);

// Meal item master data (used for composing menus)
diningRouter.get(
  "/meal-items",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  getMealItems
);

diningRouter.post(
  "/meal-items",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  validateRequest(createMealItemSchema),
  createMealItem
);

diningRouter.patch(
  "/meal-items/:itemId",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  validateRequest(updateMealItemSchema),
  updateMealItem
);

diningRouter.delete(
  "/meal-items/:itemId",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  validateRequest(deleteMealItemSchema),
  deleteMealItem
);

// Get tomorrow's created menus (lunch & dinner breakdown)
diningRouter.get(
  "/menus/tomorrow",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  getTomorrowMenusList
);

// Get today's menus for consumption tracking
diningRouter.get(
  "/menus/today",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  getTodayMenus
);

// Get all bookings for a specific menu with filters
diningRouter.get(
  "/bookings/menu/:menuId",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  validateRequest(getMenuBookingsSchema),
  getAllBookingsForMenu
);

// Get all active bookings for tomorrow
diningRouter.get(
  "/bookings/tomorrow",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  getTomorrowBookings
);

// Mark tokens as consumed during meal service
diningRouter.patch(
  "/tokens/mark-consumed",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  validateRequest(markTokensConsumedSchema),
  markTokensAsConsumed
);

// Generate daily consumption report
diningRouter.get(
  "/report/daily",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  validateRequest(getDailyReportSchema),
  getDailyReport
);

// Generate date-range sales history report
diningRouter.get(
  "/report/range",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
  validateRequest(getDateRangeSalesReportSchema),
  getDateRangeSalesReport
);

// Generate monthly summary report
diningRouter.get(
  "/report/monthly",
  authenticateToken,
  authorizeRoles("DINING_MANAGER", "ASST_DINING"),
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
  authorizeRoles("STUDENT", "DINING_MANAGER", "ASST_DINING"),
  validateRequest(getPaymentDetailsSchema),
  getPaymentDetails
);

// Process refund for cancelled tokens
diningRouter.post(
  "/payment/:paymentId/refund",
  authenticateToken,
  authorizeRoles("STUDENT", "DINING_MANAGER", "ASST_DINING"),
  validateRequest(processRefundSchema),
  processRefund
);

export default diningRouter;
