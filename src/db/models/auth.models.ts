// schema/auth.schema.ts
import { sql } from "drizzle-orm";
import type { AnyMySqlColumn } from "drizzle-orm/mysql-core";
import {
  boolean,
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  ACADEMIC_DEPARTMENTS,
  HALL_ADMIN_STATUSES,
  OPERATIONAL_UNITS,
  STAFF_ROLES,
  STUDENT_STATUSES,
} from "../../types/enums";
import { hallSQL_Enum, halls, rooms } from "./halls.models";

export const studentStatusSQL_Enum = () =>
  mysqlEnum("student_status", STUDENT_STATUSES);
export const adminDesignationSQL_Enum = () =>
  mysqlEnum("admin_designation", STAFF_ROLES);
export const operationalUnitSQL_Enum = () =>
  mysqlEnum("operational_unit", OPERATIONAL_UNITS);
export const academicDepartmentsSQL_Enum = () =>
  mysqlEnum("academic_department", ACADEMIC_DEPARTMENTS);

export const hallAdminStatusSQL_Enum = () =>
  mysqlEnum("hall_admin_status", HALL_ADMIN_STATUSES);

export const refreshTokens = mysqlTable(
  "refresh_tokens",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    userId: varchar("user_id", { length: 36 }).notNull(),

    tokenHash: varchar("token_hash", { length: 512 }).notNull().unique(),

    jti: varchar("jti", { length: 255 }).notNull().unique(),

    ip: varchar("ip", { length: 45 }),

    userAgent: varchar("user_agent", { length: 512 }),

    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("refresh_tokens_user_idx").on(table.userId),
    index("refresh_tokens_expires_idx").on(table.expiresAt),
  ]
);

export const uniStudents = mysqlTable(
  "uni_students",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    email: varchar("email", { length: 255 }).notNull().unique(),

    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    name: varchar("name", { length: 255 }).notNull(),

    phone: varchar("phone", { length: 20 }).notNull(),

    rollNumber: varchar("roll_number", { length: 20 }).notNull().unique(),

    academicDepartment: academicDepartmentsSQL_Enum().notNull(),

    isActive: boolean("is_active").notNull().default(true),

    avatarUrl: varchar("avatar_url", { length: 512 }),

    isAllocated: boolean("is_allocated").notNull().default(false),

    session: varchar("session", { length: 10 }),

    hall: hallSQL_Enum().references(() => halls.name, { onDelete: "cascade" }),

    roomId: varchar("room_id", { length: 36 }).references(() => rooms.id),

    status: studentStatusSQL_Enum().notNull().default("ACTIVE"),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_uni_students_department").on(t.academicDepartment),
    index("idx_students_hall").on(t.hall),
    index("idx_students_room").on(t.roomId),
    index("idx_students_status").on(t.status),
    index("idx_uni_students_allocated").on(t.isAllocated),
  ]
);

export const hallAdmins = mysqlTable(
  "hall_admins",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),

    email: varchar("email", { length: 255 }).notNull().unique(),

    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    name: varchar("name", { length: 255 }).notNull(),

    phone: varchar("phone", { length: 20 }).notNull(),

    academicDepartment: academicDepartmentsSQL_Enum().notNull(),

    hall: hallSQL_Enum()
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    designation: adminDesignationSQL_Enum().notNull(),

    operationalUnit: operationalUnitSQL_Enum().notNull(),

    reportingToId: varchar("reporting_to_id", { length: 36 }).references(
      (): AnyMySqlColumn => hallAdmins.id
    ),

    hallAdminStatus: hallAdminStatusSQL_Enum().notNull().default("PENDING"),

    isActive: boolean("is_active").notNull().default(true),

    avatarUrl: varchar("avatar_url", { length: 512 }),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
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
