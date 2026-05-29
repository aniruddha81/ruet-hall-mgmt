import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { DAMAGE_REPORT_STATUSES } from "../../types/enums.ts";
import { hallAdmins, uniStudents } from "./auth.models.ts";
import { hallSQL_Enum, halls } from "./halls.models.ts";

export const damageReportStatusSQL_Enum = pgEnum(
  "damage_report_status",
  DAMAGE_REPORT_STATUSES
);

export const damageReports = pgTable(
  "damage_reports",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => uniStudents.id, { onDelete: "cascade" }),

    hall: hallSQL_Enum("hall")
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    locationDescription: text("location_description"),

    assetDetails: text("asset_details"),

    imageUrl: text("image_url"),

    description: text("description").notNull(),

    fineAmount: integer("fine_amount"),

    damageCost: integer("damage_cost"),

    isStudentResponsible: boolean("is_student_responsible"),

    managerNote: text("manager_note"),

    liableStudentId: varchar("liable_student_id", { length: 36 }).references(
      () => uniStudents.id,
      { onDelete: "set null" }
    ),

    status: damageReportStatusSQL_Enum("status").notNull().default("REPORTED"),

    verifiedBy: varchar("verified_by", { length: 36 }).references(
      () => hallAdmins.id
    ),

    fixedBy: varchar("fixed_by", { length: 36 }).references(() => hallAdmins.id, {
      onDelete: "set null",
    }),

    fixedAt: timestamp("fixed_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_damage_student").on(t.studentId),
    index("idx_damage_hall").on(t.hall),
    index("idx_damage_status").on(t.status),
    index("idx_damage_liable_student").on(t.liableStudentId),
  ]
);
