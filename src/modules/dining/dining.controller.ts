import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

// ==============================================================
// STUDENT CONTROLLERS - MEAL TOKEN BOOKING & MANAGEMENT
// ==============================================================

/**
 * GET /api/v1/dining/tomorrow-menus
 *
 * Get tomorrow's lunch and dinner menu for student's hall
 * - Shows available tokens, price, menu description
 * - Returns both lunch and dinner if available
 *
 * Returns:
 * - lunch: { id, menuDescription, price, availableTokens, bookedTokens, mealType }
 * - dinner: { id, menuDescription, price, availableTokens, bookedTokens, mealType }
 */
export const getTomorrowMenus = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user?.userId;

    // TODO: Get student's hall from students table
    // TODO: Query mealMenus for tomorrow + student's hall (lunch & dinner)
    // TODO: Return menus with availability info

    res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Tomorrow's menus retrieved successfully")
      );
  }
);

/**
 * POST /api/v1/dining/book-tokens
 *
 * Book tokens for tomorrow (lunch or dinner)
 *
 * Input Body:
 * - menuId: string
 * - quantity: number (1-20 for student + friends)
 * - paymentMethod: 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CASH'
 *
 * Process:
 * 1. Validate menu is for tomorrow
 * 2. Check available tokens (availableTokens - bookedTokens >= quantity)
 * 3. Create payment record
 * 4. Create meal token record
 * 5. Update bookedTokens count in menu
 * 6. Send booking confirmation email
 *
 * Returns: payment details, token details, booking confirmation
 */
export const bookMealTokens = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user?.userId;
    const { menuId, quantity, paymentMethod } = req.body;

    // TODO: Validate menuId exists
    // TODO: Validate menu is for tomorrow
    // TODO: Validate quantity is between 1-20
    // TODO: Check available tokens in menu
    // TODO: Create mealPayments record
    // TODO: Create mealTokens record(s)
    // TODO: Update mealMenus.bookedTokens
    // TODO: Send confirmation email

    res
      .status(201)
      .json(new ApiResponse(201, {}, "Meal tokens booked successfully"));
  }
);

/**
 * GET /api/v1/dining/my-active-tokens
 *
 * Get student's active tokens for tomorrow
 * - Shows tokens that can be cancelled (before midnight)
 * - Only returns ACTIVE tokens for tomorrow
 *
 * Returns:
 * - Array of tokens with: tokenId, quantity, mealType, mealDate, price, status
 */
export const getMyActiveTokens = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user?.userId;

    // TODO: Query mealTokens where studentId AND status = 'ACTIVE' AND mealDate = tomorrow
    // TODO: Include menu details (description, mealType, price)
    // TODO: Return active tokens for cancellation

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Active tokens retrieved successfully"));
  }
);

/**
 * PATCH /api/v1/dining/cancel-token/:tokenId
 *
 * Cancel token before midnight
 *
 * Process:
 * 1. Verify token belongs to student
 * 2. Validate current time < midnight of booking date
 * 3. Update token status to CANCELLED
 * 4. Process refund (update mealPayments refundAmount, refundedAt)
 * 5. Decrease bookedTokens count in menu
 * 6. Send cancellation confirmation email
 *
 * Returns: refund details, updated token status
 */
export const cancelMealToken = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user?.userId;
    const { tokenId } = req.params;

    // TODO: Verify token belongs to student
    // TODO: Check if token status is ACTIVE
    // TODO: Validate current time < midnight of booking date
    // TODO: Update token status to CANCELLED
    // TODO: Calculate refund amount
    // TODO: Update mealPayments with refund info
    // TODO: Decrease bookedTokens in menu
    // TODO: Send cancellation email

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Token cancelled successfully"));
  }
);

/**
 * GET /api/v1/dining/token-history
 *
 * Get student's complete token purchase history
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 10)
 * - status: 'ACTIVE' | 'CANCELLED' | 'CONSUMED' (optional filter)
 * - startDate: YYYY-MM-DD (optional)
 * - endDate: YYYY-MM-DD (optional)
 *
 * Returns: paginated list of all past bookings with details
 */
export const getMyTokenHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user?.userId;
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;

    // TODO: Query mealTokens where studentId with pagination
    // TODO: Apply filters (status, date range)
    // TODO: Include menu details for each token
    // TODO: Sort by bookingDate descending
    // TODO: Return paginated results

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Token history retrieved successfully"));
  }
);

/**
 * GET /api/v1/dining/token/:tokenId
 *
 * Get single token details by ID
 *
 * Returns:
 * - Token details with payment info, menu info, meal date, quantity, status
 * - Refund details if cancelled
 * - Consumed timestamp if consumed
 */
export const getMyTokenById = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user?.userId;
    const { tokenId } = req.params;

    // TODO: Verify token belongs to student
    // TODO: Query mealTokens with paymentId and menuId joins
    // TODO: Include full meal menu details
    // TODO: Include payment details
    // TODO: Return complete token information

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Token details retrieved successfully"));
  }
);

// ==============================================================
// DINING MANAGER CONTROLLERS - MENU & BOOKING MANAGEMENT
// ==============================================================

/**
 * POST /api/v1/dining/menu/create
 *
 * Create menu for tomorrow only
 *
 * Input Body:
 * - mealType: 'LUNCH' | 'DINNER'
 * - menuDescription: string (e.g., "Rice, Chicken Curry, Dal, Salad")
 * - price: number (price per token)
 * - availableTokens: number (total tokens available)
 *
 * Process:
 * 1. Validate date is tomorrow
 * 2. Check if menu already exists for tomorrow + mealType
 * 3. Create mealMenus record
 * 4. Initialize bookedTokens = 0
 *
 * Returns: created menu details with id
 */
export const createTomorrowMenu = asyncHandler(
  async (req: Request, res: Response) => {
    const diningManagerId = req.user?.userId;
    const { mealType, menuDescription, price, availableTokens } = req.body;

    // TODO: Validate mealType is LUNCH or DINNER
    // TODO: Check menu doesn't already exist for tomorrow + mealType
    // TODO: Get manager's hall from admins table
    // TODO: Create mealMenus record with bookedTokens = 0
    // TODO: Return created menu

    res
      .status(201)
      .json(new ApiResponse(201, {}, "Menu created successfully for tomorrow"));
  }
);

/**
 * PATCH /api/v1/dining/menu/:menuId/update
 *
 * Update tomorrow's menu (before any bookings or limited updates)
 *
 * Input Body:
 * - menuDescription: string (optional)
 * - price: number (optional, may be restricted if bookings exist)
 * - availableTokens: number (optional)
 *
 * Process:
 * 1. Validate menu is for tomorrow
 * 2. Check if bookings exist (may restrict price updates)
 * 3. Validate availableTokens >= bookedTokens
 * 4. Update menu details
 *
 * Returns: updated menu details
 */
export const updateTomorrowMenu = asyncHandler(
  async (req: Request, res: Response) => {
    const { menuId } = req.params;
    const { menuDescription, price, availableTokens } = req.body;

    // TODO: Verify menu belongs to manager's hall
    // TODO: Validate menu is for tomorrow
    // TODO: If price update: check no bookings exist
    // TODO: If availableTokens update: validate >= bookedTokens
    // TODO: Update mealMenus record

    res.status(200).json(new ApiResponse(200, {}, "Menu updated successfully"));
  }
);

/**
 * DELETE /api/v1/dining/menu/:menuId
 *
 * Delete tomorrow's menu (only if no bookings)
 *
 * Process:
 * 1. Validate menu is for tomorrow
 * 2. Check bookedTokens = 0
 * 3. Delete menu record if no bookings
 * 4. Return success or error if bookings exist
 *
 * Returns: success message or error
 */
export const deleteTomorrowMenu = asyncHandler(
  async (req: Request, res: Response) => {
    const { menuId } = req.params;

    // TODO: Verify menu belongs to manager's hall
    // TODO: Check if any bookings exist (bookedTokens > 0)
    // TODO: If bookings exist, throw error
    // TODO: Delete mealMenus record

    res.status(200).json(new ApiResponse(200, {}, "Menu deleted successfully"));
  }
);

/**
 * GET /api/v1/dining/menus/tomorrow
 *
 * View tomorrow's created menus for dining manager
 * - Shows both lunch and dinner
 * - Display bookedTokens vs availableTokens
 * - Shows revenue potential
 *
 * Returns:
 * - Array of menus with: menuId, mealType, description, price, availableTokens, bookedTokens
 */
export const getTomorrowMenusList = asyncHandler(
  async (req: Request, res: Response) => {
    const diningManagerId = req.user?.userId;

    // TODO: Get manager's hall from admins table
    // TODO: Query mealMenus for tomorrow + manager's hall (lunch & dinner)
    // TODO: Include bookedTokens and availableTokens for both
    // TODO: Return menus with booking status

    res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Tomorrow's menus retrieved successfully")
      );
  }
);

/**
 * GET /api/v1/dining/menus/today
 *
 * View today's menus (for consumption tracking)
 * - Shows how many tokens were booked
 * - Used during meal service
 *
 * Returns:
 * - Array of today's menus with booking statistics
 */
export const getTodayMenus = asyncHandler(
  async (req: Request, res: Response) => {
    const diningManagerId = req.user?.userId;

    // TODO: Get manager's hall
    // TODO: Query mealMenus for today + manager's hall
    // TODO: Include token consumption data
    // TODO: Return today's menus for service

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Today's menus retrieved successfully"));
  }
);

/**
 * GET /api/v1/dining/bookings/menu/:menuId
 *
 * Get all student bookings for specific menu
 *
 * Query Parameters (optional):
 * - status: 'ACTIVE' | 'CANCELLED' | 'CONSUMED'
 * - page: number
 * - limit: number
 *
 * Returns:
 * - Array of bookings with: studentId, studentName, quantity, bookingTime, status, amount
 */
export const getAllBookingsForMenu = asyncHandler(
  async (req: Request, res: Response) => {
    const { menuId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    // TODO: Verify menu belongs to manager's hall
    // TODO: Query mealTokens where menuId with pagination
    // TODO: Apply status filter if provided
    // TODO: Include student details (name, roll number)
    // TODO: Include payment info

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Menu bookings retrieved successfully"));
  }
);

/**
 * GET /api/v1/dining/bookings/tomorrow
 *
 * Get all active bookings for tomorrow
 * - Both lunch and dinner
 * - Shows total tokens booked, revenue
 *
 * Returns:
 * - Object with lunch and dinner sections showing total bookings and revenue
 */
export const getTomorrowBookings = asyncHandler(
  async (req: Request, res: Response) => {
    const diningManagerId = req.user?.userId;

    // TODO: Get manager's hall
    // TODO: Query mealTokens for tomorrow where status = 'ACTIVE'
    // TODO: Group by mealType (lunch/dinner)
    // TODO: Calculate totals: tokens booked, revenue
    // TODO: Return summary by meal type

    res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Tomorrow's bookings retrieved successfully")
      );
  }
);

/**
 * PATCH /api/v1/dining/tokens/mark-consumed
 *
 * Mark tokens as consumed during meal service
 *
 * Input Body:
 * - tokenIds: string[] (array of token IDs or single tokenId)
 *
 * Process:
 * 1. Validate all tokens belong to manager's hall
 * 2. Update status to CONSUMED
 * 3. Set consumedAt timestamp
 * 4. Set verifiedBy to manager's id
 *
 * Returns: updated token details
 */
export const markTokensAsConsumed = asyncHandler(
  async (req: Request, res: Response) => {
    const diningManagerId = req.user?.userId;
    const { tokenIds } = req.body;

    // TODO: Validate tokenIds is array
    // TODO: Query tokens and verify belong to manager's hall
    // TODO: Update all tokens with status = 'CONSUMED', consumedAt, verifiedBy
    // TODO: Return updated tokens

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Tokens marked as consumed successfully"));
  }
);

/**
 * GET /api/v1/dining/report/daily
 *
 * Generate daily consumption report
 *
 * Query Parameters:
 * - date: YYYY-MM-DD (optional, defaults to today)
 *
 * Returns:
 * - totalTokensSold: number
 * - totalRevenue: decimal
 * - totalCancellations: number
 * - lunch: { booked, revenue, consumed }
 * - dinner: { booked, revenue, consumed }
 */
export const getDailyReport = asyncHandler(
  async (req: Request, res: Response) => {
    const diningManagerId = req.user?.userId;
    const { date } = req.query;

    // TODO: Get manager's hall
    // TODO: Query mealMenus and mealTokens for specified date
    // TODO: Calculate: total tokens sold, total revenue, cancellations
    // TODO: Break down by meal type (lunch/dinner)
    // TODO: Return comprehensive daily report

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Daily report generated successfully"));
  }
);

/**
 * GET /api/v1/dining/report/monthly
 *
 * Generate monthly summary
 *
 * Query Parameters:
 * - month: number (1-12)
 * - year: number
 *
 * Returns:
 * - totalRevenue: decimal
 * - totalTokensSold: number
 * - averageTokensPerDay: number
 * - cancellationRate: number (%)
 * - weeklyBreakdown: array
 */
export const getMonthlyReport = asyncHandler(
  async (req: Request, res: Response) => {
    const diningManagerId = req.user?.userId;
    const { month, year } = req.query;

    // TODO: Get manager's hall
    // TODO: Query all transactions for month/year
    // TODO: Calculate: total revenue, total tokens, averages, cancellation rate
    // TODO: Generate weekly breakdown
    // TODO: Return comprehensive monthly report

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Monthly report generated successfully"));
  }
);

// ==============================================================
// PAYMENT CONTROLLERS - SHARED BY STUDENT & MANAGER
// ==============================================================

/**
 * POST /api/v1/dining/payment/process
 *
 * Process payment through payment gateway
 * Called during booking flow
 *
 * Input Body:
 * - amount: decimal
 * - paymentMethod: 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CASH'
 * - transactionId: string (from payment gateway)
 * - totalQuantity: number
 *
 * Process:
 * 1. Validate payment amount matches booking
 * 2. Call payment gateway API (if online method)
 * 3. Create mealPayments record
 * 4. Return payment confirmation
 *
 * Returns: payment confirmation with transactionId, amount, status
 */
export const processPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user?.userId;
    const { amount, paymentMethod, transactionId, totalQuantity } = req.body;

    // TODO: Validate amount is positive
    // TODO: Validate paymentMethod
    // TODO: If online payment: validate with payment gateway
    // TODO: Create mealPayments record with status = 'COMPLETED'
    // TODO: Return payment confirmation

    res
      .status(201)
      .json(new ApiResponse(201, {}, "Payment processed successfully"));
  }
);

/**
 * GET /api/v1/dining/payment/:paymentId
 *
 * Get payment details by paymentId
 *
 * Returns:
 * - paymentId, amount, paymentMethod, transactionId, status
 * - paymentDate, studentId
 * - Refund details if refunded
 */
export const getPaymentDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params;

    // TODO: Query mealPayments by paymentId
    // TODO: Verify payment belongs to authenticated user (student) or manager's hall
    // TODO: Include refund details if status = 'REFUNDED'
    // TODO: Return payment information

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Payment details retrieved successfully"));
  }
);

/**
 * POST /api/v1/dining/payment/:paymentId/refund
 *
 * Handle refund processing
 *
 * Input Body:
 * - refundAmount: decimal (can be partial)
 * - refundReason: string
 *
 * Process:
 * 1. Verify payment exists and belongs to student/manager's hall
 * 2. Validate refundAmount <= original amount
 * 3. Call payment gateway for refund (if applicable)
 * 4. Update mealPayments with refund info
 * 5. Send refund confirmation email
 *
 * Returns: refund confirmation with details
 */
export const processRefund = asyncHandler(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const { refundAmount, refundReason } = req.body;

    // TODO: Verify payment exists
    // TODO: Check payment status = 'COMPLETED'
    // TODO: Validate refundAmount <= payment.amount
    // TODO: If online payment: call payment gateway for refund
    // TODO: Update mealPayments with refund details
    // TODO: Send refund confirmation email

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Refund processed successfully"));
  }
);
