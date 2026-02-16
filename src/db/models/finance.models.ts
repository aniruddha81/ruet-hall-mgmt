import { sql } from "drizzle-orm";
import {
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  DUE_STATUSES,
  DUE_TYPES,
  FINANCE_PAYMENT_METHODS,
} from "../../types/enums";
import { hallAdmins, users } from "./auth.models";
import { hallSQL_Enum, halls } from "./halls.models";

export const dueTypeSQL_Enum = mysqlEnum("due_type", DUE_TYPES);
export const dueStatusSQL_Enum = mysqlEnum("due_status", DUE_STATUSES);
export const financePaymentMethodSQL_Enum = mysqlEnum(
  "finance_payment_method",
  FINANCE_PAYMENT_METHODS
);

// ============================================
// STUDENT DUES TABLE
// ============================================
export const studentDues = mysqlTable(
  "student_dues",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    hall: hallSQL_Enum
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    type: dueTypeSQL_Enum.notNull(),

    amount: int("amount", { unsigned: true }).notNull(),

    status: dueStatusSQL_Enum.notNull().default("UNPAID"),

    paidAt: datetime("paid_at", { mode: "date" }),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_dues_student").on(t.studentId),
    index("idx_dues_hall").on(t.hall),
    index("idx_dues_status").on(t.status),
    index("idx_dues_type").on(t.type),
  ]
);

// ============================================
// PAYMENTS TABLE
// ============================================
export const payments = mysqlTable(
  "payments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    hall: hallSQL_Enum
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    dueId: varchar("due_id", { length: 36 }).references(() => studentDues.id),

    amount: int("amount", { unsigned: true }).notNull(),

    method: financePaymentMethodSQL_Enum.notNull(),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_payments_student").on(t.studentId),
    index("idx_payments_hall").on(t.hall),
  ]
);

// ============================================
// EXPENSES TABLE
// ============================================
export const expenses = mysqlTable(
  "expenses",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    hall: hallSQL_Enum
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    title: varchar("title", { length: 255 }).notNull(),

    amount: int("amount", { unsigned: true }).notNull(),

    category: varchar("category", { length: 100 }).notNull(),

    approvedBy: varchar("approved_by", { length: 36 })
      .notNull()
      .references(() => hallAdmins.id),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_expenses_hall").on(t.hall),
    index("idx_expenses_category").on(t.category),
  ]
);
