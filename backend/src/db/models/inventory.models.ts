import { sql } from "drizzle-orm";
import {
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";
import { ASSET_CONDITIONS, DAMAGE_REPORT_STATUSES } from "../../types/enums.ts";
import { hallAdmins, uniStudents } from "./auth.models.ts";
import { hallSQL_Enum, halls } from "./halls.models.ts";

export const assetConditionSQL_Enum = () =>
  mysqlEnum("asset_condition", ASSET_CONDITIONS);
export const damageReportStatusSQL_Enum = () =>
  mysqlEnum("damage_report_status", DAMAGE_REPORT_STATUSES);

// ============================================
// ASSETS TABLE
// Trackable assets in the hall
// ============================================
export const assets = mysqlTable(
  "assets",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    hall: hallSQL_Enum()
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    name: varchar("name", { length: 255 }).notNull(),

    quantity: int("quantity", { unsigned: true }).notNull().default(1),

    condition: assetConditionSQL_Enum().notNull().default("GOOD"),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("idx_assets_hall").on(t.hall)]
);

// ============================================
// DAMAGE REPORTS TABLE
// ============================================
export const damageReports = mysqlTable(
  "damage_reports",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => uniStudents.id, { onDelete: "cascade" }),

    assetId: varchar("asset_id", { length: 36 })
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),

    hall: hallSQL_Enum()
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    description: text("description").notNull(),

    fineAmount: int("fine_amount", { unsigned: true }),

    status: damageReportStatusSQL_Enum().notNull().default("REPORTED"),

    verifiedBy: varchar("verified_by", { length: 36 }).references(
      () => hallAdmins.id
    ),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_damage_student").on(t.studentId),
    index("idx_damage_asset").on(t.assetId),
    index("idx_damage_status").on(t.status),
  ]
);
