import { sql } from "drizzle-orm";
import {
  boolean,
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  smallint,
  text,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";
import { HALLS, ROOM_STATUSES } from "../../types/enums";

export const roomStatusEnum = mysqlEnum("room_status", ROOM_STATUSES);
export const hallEnum = mysqlEnum("hall", HALLS);

export const rooms = mysqlTable(
  "rooms",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    hallId: varchar("hall_id", { length: 36 })
      .notNull()
      .references(() => halls.id, { onDelete: "cascade" }),

    roomNumber: smallint("room_number", { unsigned: true }).notNull(),

    floor: tinyint("floor", { unsigned: true }).notNull(),

    capacity: tinyint("capacity", { unsigned: true }).notNull(),

    currentOccupancy: smallint("current_occupancy", { unsigned: true }).notNull().default(0),

    status: roomStatusEnum.notNull().default("AVAILABLE"),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("uq_room_hall_number").on(t.hallId, t.roomNumber),
    index("idx_rooms_hall").on(t.hallId),
    index("idx_rooms_status").on(t.status),
  ]
);

export const halls = mysqlTable("halls", {
  id: varchar("id", { length: 36 }).primaryKey(),

  name: hallEnum.notNull().unique(),

  address: text("address"),

  contactNumber: varchar("contact_number", { length: 20 }),

  totalCapacity: int("total_capacity").notNull().default(0),

  totalRooms: int("total_rooms").notNull().default(0),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: datetime("created_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  updatedAt: datetime("updated_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});
