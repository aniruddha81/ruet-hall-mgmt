import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { SEAT_APPLICATION_STATUSES } from "../../types/enums.ts";
import { academicDepartmentsSQL_Enum, hallAdmins, uniStudents } from "./auth.models.ts";
import { hallSQL_Enum, halls, rooms } from "./halls.models.ts";

export const seatApplicationStatusSQL_Enum = pgEnum(
  "seat_application_status",
  SEAT_APPLICATION_STATUSES
);

export const seatApplications = pgTable(
  "seat_applications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => uniStudents.id, { onDelete: "cascade" }),

    rollNumber: varchar("roll_number", { length: 20 }).notNull(),

    hall: hallSQL_Enum("hall").references(() => halls.name, { onDelete: "cascade" }),

    academicDepartment: academicDepartmentsSQL_Enum("academic_department").notNull(),

    session: varchar("session", { length: 10 }).notNull(),

    status: seatApplicationStatusSQL_Enum("status").notNull().default("PENDING"),

    reviewedBy: varchar("reviewed_by", { length: 36 }).references(
      () => hallAdmins.id
    ),

    reviewedAt: timestamp("reviewed_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_seat_app_student").on(t.studentId),
    index("idx_seat_app_hall").on(t.hall),
    index("idx_seat_app_status").on(t.status),
  ]
);

export const seatAllocations = pgTable(
  "seat_allocations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => uniStudents.id, { onDelete: "cascade" }),

    rollNumber: varchar("roll_number", { length: 20 }).notNull(),

    hall: hallSQL_Enum("hall")
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    roomId: varchar("room_id", { length: 36 })
      .notNull()
      .references(() => rooms.id),

    allocatedAt: timestamp("allocated_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    allocatedBy: varchar("allocated_by", { length: 36 })
      .notNull()
      .references(() => hallAdmins.id),
  },
  (t) => [
    index("idx_seat_alloc_student").on(t.studentId),
    index("idx_seat_alloc_room").on(t.roomId),
    index("idx_seat_alloc_hall").on(t.hall),
  ]
);
