import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import {
  ACADEMIC_DEPARTMENTS,
  HALL_ADMIN_STATUSES,
  OPERATIONAL_UNITS,
  STAFF_ROLES,
  STUDENT_STATUSES,
} from "../../types/enums.ts";
import { hallSQL_Enum, halls, rooms } from "./halls.models.ts";

export const studentStatusSQL_Enum = pgEnum("student_status", STUDENT_STATUSES);
export const adminDesignationSQL_Enum = pgEnum("admin_designation", STAFF_ROLES);
export const operationalUnitSQL_Enum = pgEnum("operational_unit", OPERATIONAL_UNITS);
export const academicDepartmentsSQL_Enum = pgEnum(
  "academic_department",
  ACADEMIC_DEPARTMENTS
);
export const hallAdminStatusSQL_Enum = pgEnum(
  "hall_admin_status",
  HALL_ADMIN_STATUSES
);

export const academicSessions = pgTable(
  "academic_sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),

    label: varchar("label", { length: 10 }).notNull().unique(),

    isActive: boolean("is_active").notNull().default(true),

    createdByAdminId: varchar("created_by_admin_id", { length: 36 })
      .notNull()
      .references(() => hallAdmins.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_academic_sessions_label").on(t.label),
    index("idx_academic_sessions_active").on(t.isActive),
  ]
);

export const uniStudents = pgTable(
  "uni_students",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    email: varchar("email", { length: 255 }).notNull().unique(),

    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    name: varchar("name", { length: 255 }).notNull(),

    phone: varchar("phone", { length: 20 }).notNull(),

    rollNumber: varchar("roll_number", { length: 20 }).notNull().unique(),

    academicDepartment: academicDepartmentsSQL_Enum("academic_department").notNull(),

    isActive: boolean("is_active").notNull().default(true),

    isVerified: boolean("is_verified").notNull().default(false),

    avatarUrl: varchar("avatar_url", { length: 512 }),

    isAllocated: boolean("is_allocated").notNull().default(false),

    session: varchar("session", { length: 10 }),

    hall: hallSQL_Enum("hall").references(() => halls.name, { onDelete: "cascade" }),

    roomId: varchar("room_id", { length: 36 }).references(() => rooms.id),

    status: studentStatusSQL_Enum("status").notNull().default("ACTIVE"),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_uni_students_academic_department").on(t.academicDepartment),
    index("idx_students_hall").on(t.hall),
    index("idx_students_room").on(t.roomId),
    index("idx_students_status").on(t.status),
    index("idx_uni_students_allocated").on(t.isAllocated),
  ]
);

export const hallAdmins = pgTable(
  "hall_admins",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),

    email: varchar("email", { length: 255 }).notNull().unique(),

    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    name: varchar("name", { length: 255 }).notNull(),

    phone: varchar("phone", { length: 20 }).notNull(),

    academicDepartment: academicDepartmentsSQL_Enum("academic_department"),

    hall: hallSQL_Enum("hall")
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    designation: adminDesignationSQL_Enum("designation").notNull(),

    operationalUnit: operationalUnitSQL_Enum("operational_unit").notNull(),

    reportingToId: varchar("reporting_to_id", { length: 36 }).references(
      (): AnyPgColumn => hallAdmins.id
    ),

    hallAdminStatus: hallAdminStatusSQL_Enum("hall_admin_status")
      .notNull()
      .default("PENDING"),

    isActive: boolean("is_active").notNull().default(true),

    avatarUrl: varchar("avatar_url", { length: 512 }),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_admins_designation").on(t.designation),
    index("idx_admins_hall").on(t.hall),
    index("idx_admins_reporting_to").on(t.reportingToId),
    index("idx_admins_operational_unit").on(t.operationalUnit),
  ]
);
