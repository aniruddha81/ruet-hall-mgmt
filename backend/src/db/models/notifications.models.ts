import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { NOTIFICATION_AUDIENCES } from "../../types/enums.ts";
import { hallAdmins } from "./auth.models.ts";

export const notificationAudienceSQL_Enum = pgEnum(
  "notification_audience",
  NOTIFICATION_AUDIENCES
);
export const notificationReaderRoleSQL_Enum = pgEnum(
  "notification_reader_role",
  NOTIFICATION_AUDIENCES
);

export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    title: varchar("title", { length: 255 }).notNull(),

    message: text("message").notNull(),

    targetAudience: notificationAudienceSQL_Enum("target_audience").notNull(),

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
    index("idx_notifications_target_audience").on(t.targetAudience),
    index("idx_notifications_created_by").on(t.createdByAdminId),
    index("idx_notifications_created_at").on(t.createdAt),
  ]
);

export const notificationReads = pgTable(
  "notification_reads",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    notificationId: varchar("notification_id", { length: 36 })
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),

    readerId: varchar("reader_id", { length: 36 }).notNull(),

    readerRole: notificationReaderRoleSQL_Enum("reader_role").notNull(),

    readAt: timestamp("read_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_notification_reads_notification").on(t.notificationId),
    index("idx_notification_reads_reader").on(t.readerId, t.readerRole),
  ]
);
