import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { HALLS, ROOM_STATUSES } from "../../types/enums.ts";

export const roomStatusSQL_Enum = pgEnum("room_status", ROOM_STATUSES);
export const hallSQL_Enum = pgEnum("hall", HALLS);

export const rooms = pgTable(
  "rooms",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    roomNumber: smallint("room_number").notNull(),

    hall: hallSQL_Enum("hall")
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    capacity: smallint("capacity").notNull(),

    currentOccupancy: smallint("current_occupancy").notNull().default(0),

    status: roomStatusSQL_Enum("status").notNull().default("AVAILABLE"),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_room_id").on(t.id),
    index("idx_rooms_hall").on(t.hall),
    index("idx_rooms_status").on(t.status),
  ]
);

export const halls = pgTable("halls", {
  name: hallSQL_Enum("name").primaryKey(),

  address: text("address"),

  contactNumber: varchar("contact_number", { length: 20 }),

  totalCapacity: integer("total_capacity").notNull().default(0),

  totalRooms: integer("total_rooms").notNull().default(0),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});
