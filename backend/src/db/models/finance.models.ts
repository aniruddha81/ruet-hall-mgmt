import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import {
  DUE_STATUSES,
  DUE_TYPES,
  FINANCE_PAYMENT_METHODS,
  PAYMENT_INTENT_STATUSES,
  PAYMENT_INTENT_TYPES,
} from "../../types/enums.ts";
import { hallAdmins, uniStudents } from "./auth.models.ts";
import { hallSQL_Enum, halls } from "./halls.models.ts";

export const dueTypeSQL_Enum = pgEnum("due_type", DUE_TYPES);
export const dueStatusSQL_Enum = pgEnum("due_status", DUE_STATUSES);
export const financePaymentMethodSQL_Enum = pgEnum(
  "finance_payment_method",
  FINANCE_PAYMENT_METHODS
);
export const paymentIntentTypeSQL_Enum = pgEnum(
  "payment_intent_type",
  PAYMENT_INTENT_TYPES
);
export const paymentIntentStatusSQL_Enum = pgEnum(
  "payment_intent_status",
  PAYMENT_INTENT_STATUSES
);

export const paymentIntents = pgTable(
  "payment_intents",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tranId: varchar("tran_id", { length: 30 }).notNull().unique(),
    type: paymentIntentTypeSQL_Enum("type").notNull(),
    status: paymentIntentStatusSQL_Enum("status").notNull().default("PENDING"),
    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => uniStudents.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    payload: jsonb("payload").notNull(),
    valId: varchar("val_id", { length: 50 }),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (t) => [
    index("idx_payment_intents_student").on(t.studentId),
    index("idx_payment_intents_status").on(t.status),
    index("idx_payment_intents_tran_id").on(t.tranId),
  ]
);

export const studentDues = pgTable(
  "student_dues",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => uniStudents.id, { onDelete: "cascade" }),

    hall: hallSQL_Enum("hall")
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    type: dueTypeSQL_Enum("type").notNull(),

    amount: integer("amount").notNull(),

    status: dueStatusSQL_Enum("status").notNull().default("UNPAID"),

    paidAt: timestamp("paid_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: timestamp("updated_at", { mode: "date" })
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

export const payments = pgTable(
  "payments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => uniStudents.id, { onDelete: "cascade" }),

    hall: hallSQL_Enum("hall")
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    dueId: varchar("due_id", { length: 36 }).references(() => studentDues.id),

    amount: integer("amount").notNull(),

    method: financePaymentMethodSQL_Enum("method").notNull(),

    bankReceiptUrl: text("bank_receipt_url"),

    receiptVerifiedAt: timestamp("receipt_verified_at", { mode: "date" }),

    receiptVerifiedBy: varchar("receipt_verified_by", {
      length: 36,
    }).references(() => hallAdmins.id),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_payments_student").on(t.studentId),
    index("idx_payments_hall").on(t.hall),
  ]
);

export const expenses = pgTable(
  "expenses",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    hall: hallSQL_Enum("hall")
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    title: varchar("title", { length: 255 }).notNull(),

    amount: integer("amount").notNull(),

    category: varchar("category", { length: 100 }).notNull(),

    approvedBy: varchar("approved_by", { length: 36 })
      .notNull()
      .references(() => hallAdmins.id),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_expenses_hall").on(t.hall),
    index("idx_expenses_category").on(t.category),
  ]
);
