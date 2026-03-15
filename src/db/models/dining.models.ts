// schema/dining.models.ts
import { sql } from "drizzle-orm";
import {
  date,
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";
import { MEAL_TYPES, PAYMENT_METHODS, TOKEN_STATUSES } from "../../types/enums.ts";
import { hallAdmins, uniStudents } from "./auth.models.ts";
import { hallSQL_Enum, halls } from "./halls.models.ts";

// ============================================
// ENUMS
// ============================================
export const mealTypeSQL_Enum = () => mysqlEnum("meal_type", MEAL_TYPES);
// ['LUNCH', 'DINNER']

export const tokenStatusSQL_Enum = () =>
  mysqlEnum("token_status", TOKEN_STATUSES);
// ['ACTIVE', 'CANCELLED', 'CONSUMED']

export const paymentMethodSQL_Enum = () =>
  mysqlEnum("payment_method", PAYMENT_METHODS);
// ['BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CASH']

// ============================================
// 1. MEAL MENUS TABLE
// Dining Manager creates menu for TOMORROW only
// ============================================
export const mealMenus = mysqlTable(
  "meal_menus",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),

    hall: hallSQL_Enum()
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    mealDate: date("meal_date", { mode: "date" })
      .notNull()
      .default(sql`(CURRENT_DATE + INTERVAL 1 DAY)`),
    // Must be tomorrow's date

    mealType: mealTypeSQL_Enum().notNull(),
    // LUNCH or DINNER

    menuDescription: text("menu_description"),
    // e.g., "Rice, Chicken Curry, Dal, Salad"

    price: tinyint("price", { unsigned: true }).notNull().default(40),
    // Price per token (in Taka, max 255)

    totalTokens: int("total_tokens", { unsigned: true }).notNull(),
    // Total tokens set by dining manager (e.g., 200)

    bookedTokens: int("booked_tokens", { unsigned: true }).notNull().default(0),
    // How many tokens have been booked (updated when booking/cancelling)

    // This field will be auto-calculated by MySQL
    availableTokens: int("available_tokens", { unsigned: true })
      .notNull()
      .generatedAlwaysAs(sql`(\`total_tokens\` - \`booked_tokens\`)`, {
        mode: "stored",
      }),
    // Automatically: totalTokens - bookedTokens

    // isActive: boolean("is_active").notNull().default(true),

    createdBy: varchar("created_by", { length: 36 })
      .notNull()
      .references(() => hallAdmins.id),
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
    index("idx_meal_menus_hall").on(t.hall),
    index("idx_meal_menus_date").on(t.mealDate),
    // index("idx_meal_menus_active").on(t.isActive),
    // Unique constraint: One lunch and one dinner per hall per day
    index("uq_menu_hall_date_type").on(t.hall, t.mealDate, t.mealType),
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
      .references(() => uniStudents.id, { onDelete: "cascade" }),
    // Student who booked the tokens

    menuId: varchar("menu_id", { length: 36 })
      .notNull()
      .references(() => mealMenus.id, { onDelete: "cascade" }),

    hall: hallSQL_Enum()
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    mealDate: date("meal_date", { mode: "date" }).notNull(),
    // Tomorrow's date (when meal will be consumed)

    mealType: mealTypeSQL_Enum().notNull(),
    // LUNCH or DINNER

    quantity: tinyint("quantity", { unsigned: true }).notNull().default(1),
    // Number of tokens booked (1-20 for student + friends)

    totalAmount: int("total_amount", { unsigned: true }).notNull(),
    // quantity * pricePerToken

    paymentId: varchar("payment_id", { length: 36 })
      .notNull()
      .references(() => mealPayments.id),

    bookingTime: datetime("booking_time", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    // Exact time of booking

    cancelledAt: datetime("cancelled_at", { mode: "date" }),
    // If cancelled before midnight tonight

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
    index("idx_meal_tokens_hall").on(t.hall),
    index("idx_meal_tokens_date").on(t.mealDate),
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
      .references(() => uniStudents.id, { onDelete: "cascade" }),

    amount: int("amount", { unsigned: true }).notNull(),
    // Total amount paid (in Taka)

    totalQuantity: tinyint("total_quantity", { unsigned: true }).notNull(),
    // Total tokens purchased in this payment

    paymentMethod: paymentMethodSQL_Enum().notNull(),
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
