import { sql } from "drizzle-orm";
import {
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";
import { NOTIFICATION_AUDIENCES } from "../../types/enums.ts";
import { hallAdmins } from "./auth.models.ts";

const notificationAudienceSQL_Enum = () =>
  mysqlEnum("notification_audience", NOTIFICATION_AUDIENCES);

const notificationReaderRoleSQL_Enum = () =>
  mysqlEnum("notification_reader_role", NOTIFICATION_AUDIENCES);

export const notifications = mysqlTable(
  "notifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    title: varchar("title", { length: 255 }).notNull(),

    message: text("message").notNull(),

    targetAudience: notificationAudienceSQL_Enum().notNull(),

    createdByAdminId: varchar("created_by_admin_id", { length: 36 })
      .notNull()
      .references(() => hallAdmins.id, { onDelete: "cascade" }),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_notifications_target_audience").on(t.targetAudience),
    index("idx_notifications_created_by").on(t.createdByAdminId),
    index("idx_notifications_created_at").on(t.createdAt),
  ]
);

export const notificationReads = mysqlTable(
  "notification_reads",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    notificationId: varchar("notification_id", { length: 36 })
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),

    readerId: varchar("reader_id", { length: 36 }).notNull(),

    readerRole: notificationReaderRoleSQL_Enum().notNull(),

    readAt: datetime("read_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_notification_reads_notification").on(t.notificationId),
    index("idx_notification_reads_reader").on(t.readerId, t.readerRole),
  ]
);
