import { z } from "zod";
import { HALLS, MEAL_TYPES, PAYMENT_METHODS, TOKEN_STATUSES } from "../../types/enums";

// ==============================================================
// STUDENT VALIDATORS
// ==============================================================

/**
 * Validator for booking meal tokens
 * POST /api/v1/dining/book-tokens
 */
export const bookMealTokensSchema = {
  body: z.object({
    menuId: z.uuid("Invalid menu ID format").describe("UUID of the meal menu"),
    quantity: z
      .number()
      .int("Quantity must be an integer")
      .min(1, "Quantity must be at least 1")
      .max(20, "Maximum 20 tokens per booking (for self + friends)")
      .describe("Number of tokens to book (tinyint)"),
    paymentMethod: z
      .enum(PAYMENT_METHODS)
      .describe("Payment method used for booking"),
    hall: z.enum(HALLS).describe("Hall for which the tokens are being booked"),
  }),
};

/**
 * Validator for cancelling a meal token
 * PATCH /api/v1/dining/cancel-token/:tokenId
 */
export const cancelMealTokenSchema = {
  params: z.object({
    tokenId: z
      .uuid("Invalid token ID format")
      .describe("UUID of the meal token to cancel"),
  }),
};

/**
 * Validator for getting token history with pagination and filters
 * GET /api/v1/dining/token-history
 */
export const getTokenHistorySchema = {
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1))
      .refine((val) => val >= 1, "Page must be at least 1")
      .describe("Page number for pagination (default: 1)"),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10))
      .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100")
      .describe("Number of records per page (default: 10)"),
    status: z
      .enum(TOKEN_STATUSES)
      .optional()
      .describe("Filter by token status"),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date format must be YYYY-MM-DD")
      .optional()
      .describe("Start date for filtering (YYYY-MM-DD)"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date format must be YYYY-MM-DD")
      .optional()
      .describe("End date for filtering (YYYY-MM-DD)"),
  }),
};

/**
 * Validator for getting single token by ID
 * GET /api/v1/dining/token/:tokenId
 */
export const getTokenByIdSchema = {
  params: z.object({
    tokenId: z
      .uuid("Invalid token ID format")
      .describe("UUID of the meal token"),
  }),
};

// ==============================================================
// DINING MANAGER VALIDATORS
// ==============================================================

/**
 * Validator for creating tomorrow's menu
 * POST /api/v1/dining/menu/create
 */
export const createMenuSchema = {
  body: z.object({
    mealType: z.enum(MEAL_TYPES).describe("Type of meal (LUNCH or DINNER)"),
    menuDescription: z
      .string()
      .min(5, "Menu description must be at least 5 characters")
      .max(500, "Menu description cannot exceed 500 characters")
      .describe(
        "Description of the meal menu (e.g., Rice, Chicken Curry, Dal, Salad)"
      ),
    price: z
      .number()
      .int("Price must be an integer")
      .min(1, "Price must be at least 1")
      .max(255, "Price cannot exceed 255")
      .default(40)
      .describe("Price per token (tinyint, max 255)"),
    totalTokens: z
      .number()
      .int("Total tokens must be an integer")
      .min(1, "Total tokens must be at least 1")
      .max(1000, "Maximum 1000 tokens per menu")
      .describe("Total tokens set by dining manager (int, max 1000)"),
  }),
};

/**
 * Validator for updating menu details
 * PATCH /api/v1/dining/menu/:menuId/update
 */
export const updateMenuSchema = {
  params: z.object({
    menuId: z
      .uuid("Invalid menu ID format")
      .describe("UUID of the menu to update"),
  }),
  body: z
    .object({
      menuDescription: z
        .string()
        .min(5, "Menu description must be at least 5 characters")
        .max(500, "Menu description cannot exceed 500 characters")
        .optional()
        .describe("Updated menu description"),
      price: z
        .number()
        .int("Price must be an integer")
        .min(1, "Price must be at least 1")
        .max(255, "Price cannot exceed 255")
        .optional()
        .describe("Updated price per token (tinyint, max 255)"),
      totalTokens: z
        .number()
        .int("Total tokens must be an integer")
        .min(1, "Total tokens must be at least 1")
        .max(1000, "Maximum 1000 tokens per menu")
        .optional()
        .describe("Updated total tokens (int, max 1000)"),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field must be provided for update"
    ),
};

/**
 * Validator for deleting a menu
 * DELETE /api/v1/dining/menu/:menuId
 */
export const deleteMenuSchema = {
  params: z.object({
    menuId: z
      .uuid("Invalid menu ID format")
      .describe("UUID of the menu to delete"),
  }),
};

/**
 * Validator for getting all bookings for a menu
 * GET /api/v1/dining/bookings/menu/:menuId
 */
export const getMenuBookingsSchema = {
  params: z.object({
    menuId: z.uuid("Invalid menu ID format").describe("UUID of the menu"),
  }),
  query: z.object({
    status: z
      .enum(TOKEN_STATUSES)
      .optional()
      .describe("Filter by token status"),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1))
      .refine((val) => val >= 1, "Page must be at least 1")
      .describe("Page number for pagination"),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 20))
      .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100")
      .describe("Number of records per page"),
  }),
};

/**
 * Validator for marking tokens as consumed
 * PATCH /api/v1/dining/tokens/mark-consumed
 */
export const markTokensConsumedSchema = {
  body: z.object({
    tokenIds: z
      .array(z.uuid("Each token ID must be a valid UUID"))
      .nonempty("At least one token ID must be provided")
      .describe("Array of token IDs to mark as consumed"),
  }),
};

/**
 * Validator for daily report query
 * GET /api/v1/dining/report/daily
 */
export const getDailyReportSchema = {
  query: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date format must be YYYY-MM-DD")
      .optional()
      .describe("Report date (YYYY-MM-DD, defaults to today)"),
  }),
};

/**
 * Validator for monthly report query
 * GET /api/v1/dining/report/monthly
 */
export const getMonthlyReportSchema = {
  query: z.object({
    month: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val >= 1 && val <= 12, "Month must be between 1 and 12")
      .describe("Month number (1-12)"),
    year: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val >= 2000, "Year must be 2000 or later")
      .describe("Year (YYYY)"),
  }),
};

// ==============================================================
// PAYMENT VALIDATORS
// ==============================================================

/**
 * Validator for processing payment
 * POST /api/v1/dining/payment/process
 */
export const processPaymentSchema = {
  body: z.object({
    amount: z
      .number()
      .positive("Amount must be greater than 0")
      .describe("Payment amount in BDT"),
    paymentMethod: z.enum(PAYMENT_METHODS).describe("Payment method"),
    transactionId: z
      .string()
      .min(3, "Transaction ID must be at least 3 characters")
      .max(255, "Transaction ID cannot exceed 255 characters")
      .describe(
        "Unique transaction ID from payment gateway or manual reference"
      ),
    totalQuantity: z
      .number()
      .int("Total quantity must be an integer")
      .positive("Total quantity must be greater than 0")
      .describe("Total number of tokens purchased in this payment"),
  }),
};

/**
 * Validator for getting payment details
 * GET /api/v1/dining/payment/:paymentId
 */
export const getPaymentDetailsSchema = {
  params: z.object({
    paymentId: z
      .uuid("Invalid payment ID format")
      .describe("UUID of the payment"),
  }),
};

/**
 * Validator for processing refund
 * POST /api/v1/dining/payment/:paymentId/refund
 */
export const processRefundSchema = {
  params: z.object({
    paymentId: z
      .uuid("Invalid payment ID format")
      .describe("UUID of the payment to refund"),
  }),
  body: z.object({
    refundAmount: z
      .number()
      .positive("Refund amount must be greater than 0")
      .describe("Amount to refund in BDT"),
    refundReason: z
      .string()
      .min(5, "Refund reason must be at least 5 characters")
      .max(500, "Refund reason cannot exceed 500 characters")
      .describe("Reason for refund"),
  }),
};

// ==============================================================
// EXPORT TYPES FOR TYPESCRIPT
// ==============================================================

export type BookMealTokensInput = z.infer<typeof bookMealTokensSchema>;
export type CancelMealTokenInput = z.infer<typeof cancelMealTokenSchema>;
export type GetTokenHistoryInput = z.infer<typeof getTokenHistorySchema>;
export type GetTokenByIdInput = z.infer<typeof getTokenByIdSchema>;
export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
export type DeleteMenuInput = z.infer<typeof deleteMenuSchema>;
export type GetMenuBookingsInput = z.infer<typeof getMenuBookingsSchema>;
export type MarkTokensConsumedInput = z.infer<typeof markTokensConsumedSchema>;
export type GetDailyReportInput = z.infer<typeof getDailyReportSchema>;
export type GetMonthlyReportInput = z.infer<typeof getMonthlyReportSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type GetPaymentDetailsInput = z.infer<typeof getPaymentDetailsSchema>;
export type ProcessRefundInput = z.infer<typeof processRefundSchema>;
