// schema/auth.schema.ts
import { sql } from "drizzle-orm";
import {
  boolean,
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  smallint,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  ACADEMIC_DEPARTMENTS,
  OPERATIONAL_UNITS,
  ROLES,
  STAFF_ROLES,
  STUDENT_STATUSES,
} from "../../types/enums";
import { hallSQL_Enum, halls, rooms } from "./halls.models";

export const userRoleSQL_Enum = mysqlEnum("user_role", ROLES);
export const studentStatusSQL_Enum = mysqlEnum(
  "student_status",
  STUDENT_STATUSES
);
export const adminDesignationSQL_Enum = mysqlEnum(
  "admin_designation",
  STAFF_ROLES
);
export const operationalUnitSQL_Enum = mysqlEnum(
  "operational_unit",
  OPERATIONAL_UNITS
);
export const academicDepartmentsSQL_Enum = mysqlEnum(
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

    phone: varchar("phone", { length: 20 }).notNull(),

    role: userRoleSQL_Enum.notNull().default("STUDENT"),

    academicDepartment: academicDepartmentsSQL_Enum.notNull(),

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

export const hallStudents = mysqlTable(
  "hall_students",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    userId: varchar("user_id", { length: 36 })
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    rollNumber: int("roll_number").notNull().unique(),

    session: varchar("session", { length: 10 }),

    hall: hallSQL_Enum.references(() => halls.name, { onDelete: "cascade" }),

    roomNumber: smallint("room_number", { unsigned: true }).references(
      () => rooms.roomNumber
    ),

    status: studentStatusSQL_Enum.notNull().default("ACTIVE"),

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
    index("idx_students_room").on(t.roomNumber),
    index("idx_students_status").on(t.status),
  ]
);

export const hallAdmins = mysqlTable(
  "hall_admins",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),

    userId: varchar("user_id", { length: 36 })
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    hall: hallSQL_Enum
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    designation: adminDesignationSQL_Enum.notNull(),

    operationalUnit: operationalUnitSQL_Enum.notNull(),

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
