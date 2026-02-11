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

export const roomStatusSQL_Enum = mysqlEnum("room_status", ROOM_STATUSES);
export const hallSQL_Enum = mysqlEnum("hall", HALLS);

export const rooms = mysqlTable(
  "rooms",
  {
    roomNumber: smallint("room_number", { unsigned: true })
      .notNull()
      .primaryKey(),

    hall: hallSQL_Enum
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    capacity: tinyint("capacity", { unsigned: true }).notNull(),

    currentOccupancy: smallint("current_occupancy", { unsigned: true })
      .notNull()
      .default(0),

    status: roomStatusSQL_Enum.notNull().default("AVAILABLE"),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("uq_room_hall_number").on(t.hall, t.roomNumber),
    index("idx_rooms_hall").on(t.hall),
    index("idx_rooms_status").on(t.status),
  ]
);

export const halls = mysqlTable("halls", {
  name: hallSQL_Enum.notNull().primaryKey().unique(),

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
