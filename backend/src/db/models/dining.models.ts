import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import {
  MEAL_TYPES,
  PAYMENT_METHODS,
  TOKEN_STATUSES,
} from "../../types/enums.ts";
import { hallAdmins, uniStudents } from "./auth.models.ts";
import { hallSQL_Enum, halls } from "./halls.models.ts";

export const mealTypeSQL_Enum = pgEnum("meal_type", MEAL_TYPES);
export const tokenStatusSQL_Enum = pgEnum("token_status", TOKEN_STATUSES);
export const paymentMethodSQL_Enum = pgEnum("payment_method", PAYMENT_METHODS);

export const mealItems = pgTable(
  "meal_items",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),

    name: varchar("name", { length: 120 }).notNull().unique(),

    isActive: boolean("is_active").notNull().default(true),

    createdBy: varchar("created_by", { length: 36 })
      .notNull()
      .references(() => hallAdmins.id),

    updatedBy: varchar("updated_by", { length: 36 })
      .notNull()
      .references(() => hallAdmins.id),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_meal_items_name").on(t.name),
    index("idx_meal_items_active").on(t.isActive),
  ]
);

export const mealMenus = pgTable(
  "meal_menus",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),

    hall: hallSQL_Enum("hall")
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    mealDate: date("meal_date", { mode: "date" })
      .notNull()
      .default(sql`(CURRENT_DATE + INTERVAL '1 day')`),

    mealType: mealTypeSQL_Enum("meal_type").notNull(),

    menuDescription: text("menu_description"),

    price: smallint("price").notNull().default(40),

    totalTokens: integer("total_tokens").notNull(),

    bookedTokens: integer("booked_tokens").notNull().default(0),

    availableTokens: integer("available_tokens").generatedAlwaysAs(
      sql`total_tokens - booked_tokens`
    ),

    createdBy: varchar("created_by", { length: 36 })
      .notNull()
      .references(() => hallAdmins.id),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_meal_menus_hall").on(t.hall),
    index("idx_meal_menus_date").on(t.mealDate),
    index("uq_menu_hall_date_type").on(t.hall, t.mealDate, t.mealType),
  ]
);

export const mealTokens = pgTable(
  "meal_tokens",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => uniStudents.id, { onDelete: "cascade" }),

    menuId: varchar("menu_id", { length: 36 })
      .notNull()
      .references(() => mealMenus.id, { onDelete: "cascade" }),

    hall: hallSQL_Enum("hall")
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    mealDate: date("meal_date", { mode: "date" }).notNull(),

    mealType: mealTypeSQL_Enum("meal_type").notNull(),

    quantity: smallint("quantity").notNull().default(1),

    totalAmount: integer("total_amount").notNull(),

    paymentId: varchar("payment_id", { length: 36 })
      .notNull()
      .references(() => mealPayments.id),

    bookingTime: timestamp("booking_time", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    cancelledAt: timestamp("cancelled_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: timestamp("updated_at", { mode: "date" })
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

export const mealPayments = pgTable(
  "meal_payments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => uniStudents.id, { onDelete: "cascade" }),

    amount: integer("amount").notNull(),

    totalQuantity: smallint("total_quantity").notNull(),

    paymentMethod: paymentMethodSQL_Enum("payment_method").notNull(),

    transactionId: varchar("transaction_id", { length: 255 }).unique(),

    bankReceiptUrl: text("bank_receipt_url"),

    receiptVerifiedAt: timestamp("receipt_verified_at", { mode: "date" }),

    receiptVerifiedBy: varchar("receipt_verified_by", {
      length: 36,
    }).references(() => hallAdmins.id),

    paymentDate: timestamp("payment_date", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    refundedAt: timestamp("refunded_at", { mode: "date" }),

    refundAmount: integer("refund_amount"),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_meal_payments_student").on(t.studentId),
    index("idx_meal_payments_date").on(t.paymentDate),
  ]
);

export const mealMenuItems = pgTable(
  "meal_menu_items",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),

    menuId: varchar("menu_id", { length: 36 })
      .notNull()
      .references(() => mealMenus.id, { onDelete: "cascade" }),

    mealItemId: varchar("meal_item_id", { length: 36 })
      .notNull()
      .references(() => mealItems.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_meal_menu_items_menu").on(t.menuId),
    index("idx_meal_menu_items_item").on(t.mealItemId),
    index("uq_meal_menu_item_pair").on(t.menuId, t.mealItemId),
  ]
);
