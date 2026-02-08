// schema/auth.schema.ts
import { sql } from "drizzle-orm";
import {
  boolean,
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  ACADEMIC_DEPARTMENTS,
  HALLS,
  OPERATIONAL_UNITS,
  ROLES,
  STAFF_ROLES,
  STUDENT_STATUSES,
} from "../../types/enums";
import { halls, rooms } from "./halls.models";

export const userRoleEnum = mysqlEnum("user_role", ROLES);
export const studentStatusEnum = mysqlEnum("student_status", STUDENT_STATUSES);
export const adminDesignationEnum = mysqlEnum("admin_designation", STAFF_ROLES);
export const operationalUnitEnum = mysqlEnum(
  "operational_unit",
  OPERATIONAL_UNITS
);
export const hallEnum = mysqlEnum("hall", HALLS);
export const academicDepartmentsEnum = mysqlEnum(
  "academic_department",
  ACADEMIC_DEPARTMENTS
);

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    email: varchar("email", { length: 255 }).notNull().unique(),

    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    name: varchar("name", { length: 255 }).notNull(),

    phone: varchar("phone", { length: 20 }),

    role: userRoleEnum.notNull().default("STUDENT"),

    academicDepartment: academicDepartmentsEnum.notNull(),

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
  (t) => [index("idx_users_role").on(t.role)]
);

export const refreshTokens = mysqlTable(
  "refresh_tokens",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

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

export const students = mysqlTable(
  "students",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    userId: varchar("user_id", { length: 36 })
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    rollNumber: int("roll_number").notNull().unique(),

    session: varchar("session", { length: 10 }),

    hall: hallEnum.references(() => halls.name, { onDelete: "cascade" }),

    roomId: varchar("room_id", { length: 36 }).references(() => rooms.id),

    status: studentStatusEnum.notNull().default("ACTIVE"),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_students_hall").on(t.hall),
    index("idx_students_room").on(t.roomId),
    index("idx_students_status").on(t.status),
  ]
);

export const admins = mysqlTable(
  "admins",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    userId: varchar("user_id", { length: 36 })
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    hall: hallEnum
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    designation: adminDesignationEnum.notNull(),

    operationalUnit: operationalUnitEnum.notNull(),

    reportingToId: varchar("reporting_to_id", { length: 36 }).references(
      () => users.id
    ),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_admins_hall").on(t.hall),
    index("idx_admins_reporting_to").on(t.reportingToId),
    index("idx_admins_operational_unit").on(t.operationalUnit),
    index("uq_admin_user_hall").on(t.userId, t.hall),
  ]
);
