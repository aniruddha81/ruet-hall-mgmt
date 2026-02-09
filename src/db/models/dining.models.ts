// schema/dining.models.ts
import { sql } from "drizzle-orm";
import {
  boolean,
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
  date,
  tinyint,
} from "drizzle-orm/mysql-core";
import { MEAL_TYPES, TOKEN_STATUSES, PAYMENT_METHODS } from "../../types/enums";
import { halls } from "./halls.models";
import { students, users } from "./auth.models";

// ============================================
// ENUMS
// ============================================
export const mealTypeEnum = mysqlEnum("meal_type", MEAL_TYPES);
// ['LUNCH', 'DINNER']

export const tokenStatusEnum = mysqlEnum("token_status", TOKEN_STATUSES);
// ['ACTIVE', 'CANCELLED', 'CONSUMED']

export const paymentMethodEnum = mysqlEnum("payment_method", PAYMENT_METHODS);
// ['BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CASH']

// ============================================
// 1. MEAL MENUS TABLE
// Dining Manager creates menu for TOMORROW only
// ============================================
export const mealMenus = mysqlTable(
  "meal_menus",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    hallId: varchar("hall_id", { length: 36 })
      .notNull()
      .references(() => halls.id, { onDelete: "cascade" }),

    mealDate: date("meal_date", { mode: "date" }).notNull(),
    // Must be tomorrow's date

    mealType: mealTypeEnum.notNull(),
    // LUNCH or DINNER

    menuDescription: text("menu_description"),
    // e.g., "Rice, Chicken Curry, Dal, Salad"

    price: tinyint("price", { unsigned: true }).notNull(),
    // Price per token (in Taka, max 255)

    availableTokens: int("available_tokens").notNull(),
    // Total tokens set by dining manager

    bookedTokens: int("booked_tokens").notNull().default(0),
    // How many tokens have been booked

    isActive: boolean("is_active").notNull().default(true),

    createdBy: varchar("created_by", { length: 36 })
      .notNull()
      .references(() => users.id),
    // Dining Manager who created this menu

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_meal_menus_hall").on(t.hallId),
    index("idx_meal_menus_date").on(t.mealDate),
    index("idx_meal_menus_active").on(t.isActive),
    // Unique constraint: One lunch and one dinner per hall per day
    index("uq_menu_hall_date_type").on(t.hallId, t.mealDate, t.mealType),
  ]
);

// ============================================
// 2. MEAL TOKENS TABLE
// Students book tokens for tomorrow
// Can buy multiple tokens (for friends)
// Can cancel until midnight tonight
// ============================================
export const mealTokens = mysqlTable(
  "meal_tokens",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    // Student who booked the tokens

    menuId: varchar("menu_id", { length: 36 })
      .notNull()
      .references(() => mealMenus.id, { onDelete: "cascade" }),

    hallId: varchar("hall_id", { length: 36 })
      .notNull()
      .references(() => halls.id, { onDelete: "cascade" }),

    mealDate: date("meal_date", { mode: "date" }).notNull(),
    // Tomorrow's date (when meal will be consumed)

    mealType: mealTypeEnum.notNull(),
    // LUNCH or DINNER

    quantity: tinyint("quantity", { unsigned: true }).notNull().default(1),
    // Number of tokens booked (1-20 for student + friends)

    pricePerToken: tinyint("price_per_token", { unsigned: true }).notNull(),
    // Price at the time of booking (snapshot)

    totalAmount: int("total_amount", { unsigned: true }).notNull(),
    // quantity * pricePerToken

    status: tokenStatusEnum.notNull().default("ACTIVE"),
    // ACTIVE, CANCELLED, CONSUMED

    paymentId: varchar("payment_id", { length: 36 })
      .notNull()
      .references(() => mealPayments.id),

    bookingDate: date("booking_date", { mode: "date" }).notNull(),
    // Date when booking was made (today)

    bookingTime: datetime("booking_time", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    // Exact time of booking

    cancelledAt: datetime("cancelled_at", { mode: "date" }),
    // If cancelled before midnight

    consumedAt: datetime("consumed_at", { mode: "date" }),
    // When tokens were used for meal

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_meal_tokens_student").on(t.studentId),
    index("idx_meal_tokens_menu").on(t.menuId),
    index("idx_meal_tokens_hall").on(t.hallId),
    index("idx_meal_tokens_date").on(t.mealDate),
    index("idx_meal_tokens_status").on(t.status),
    index("idx_meal_tokens_payment").on(t.paymentId),
  ]
);

// ============================================
// 3. MEAL PAYMENTS TABLE
// Payment for meal tokens (PREPAID)
// ============================================
export const mealPayments = mysqlTable(
  "meal_payments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),

    amount: int("amount", { unsigned: true }).notNull(),
    // Total amount paid (in Taka)

    totalQuantity: tinyint("total_quantity", { unsigned: true }).notNull(),
    // Total tokens purchased in this payment

    paymentMethod: paymentMethodEnum.notNull(),
    // BKASH, NAGAD, ROCKET, BANK, CASH

    transactionId: varchar("transaction_id", { length: 255 }).unique(),
    // Unique transaction ID from payment gateway

    paymentDate: datetime("payment_date", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    refundedAt: datetime("refunded_at", { mode: "date" }),
    // When refund was processed (if cancelled)

    refundAmount: int("refund_amount", { unsigned: true }),
    // Amount refunded (can be partial if some tokens cancelled)

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_meal_payments_student").on(t.studentId),
    index("idx_meal_payments_date").on(t.paymentDate),
  ]
);
