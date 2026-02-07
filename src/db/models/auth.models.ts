// schema/auth.schema.ts
import {
  mysqlEnum,
  mysqlTable,
  varchar,
  datetime,
  index,
} from "drizzle-orm/mysql-core";
import { ROLES } from "../../types/roles";
import { sql } from "drizzle-orm";

/**
 * User roles enum
 */
export const userRoleEnum = mysqlEnum("user_role", ROLES);

/**
 * Users table
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  passwordHash: varchar("password_hash", { length: 255 }).notNull(),

  name: varchar("name", { length: 255 }).notNull(),

  role: userRoleEnum.notNull().default("STUDENT"),

  avatarUrl: varchar("avatar_url", { length: 512 }).default(sql`NULL`),

  createdAt: datetime("created_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  updatedAt: datetime("updated_at", { mode: "date" })
    .notNull()
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

/**
 * Refresh tokens table
 */
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
