import { sql } from "drizzle-orm";
import {
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";
import { SEAT_APPLICATION_STATUSES } from "../../types/enums";
import {
  academicDepartmentsSQL_Enum,
  hallAdmins,
  uniStudents,
} from "./auth.models";
import { hallSQL_Enum, halls, rooms } from "./halls.models";
import { beds } from "./inventory.models.ts";

export const seatApplicationStatusSQL_Enum = () =>
  mysqlEnum("seat_application_status", SEAT_APPLICATION_STATUSES);

// ============================================
// SEAT APPLICATIONS
// Students apply for a hall seat
// ============================================
export const seatApplications = mysqlTable(
  "seat_applications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => uniStudents.id, { onDelete: "cascade" }),

    rollNumber: varchar("roll_number", { length: 20 }).notNull(),

    hall: hallSQL_Enum().references(() => halls.name, { onDelete: "cascade" }),

    department: academicDepartmentsSQL_Enum().notNull(),

    session: varchar("session", { length: 10 }).notNull(),

    status: seatApplicationStatusSQL_Enum().notNull().default("PENDING"),

    reviewedBy: varchar("reviewed_by", { length: 36 }).references(
      () => hallAdmins.id
    ),

    reviewedAt: datetime("reviewed_at", { mode: "date" }),

    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_seat_app_student").on(t.studentId),
    index("idx_seat_app_hall").on(t.hall),
    index("idx_seat_app_status").on(t.status),
  ]
);

// ============================================
// SEAT ALLOCATIONS
// Admin allocates a bed to a student
// ============================================
export const seatAllocations = mysqlTable(
  "seat_allocations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => uniStudents.id, { onDelete: "cascade" }),

    rollNumber: varchar("roll_number", { length: 20 }).notNull(),

    hall: hallSQL_Enum()
      .notNull()
      .references(() => halls.name, { onDelete: "cascade" }),

    roomId: varchar("room_id", { length: 36 })
      .notNull()
      .references(() => rooms.id),

    bedId: varchar("bed_id", { length: 36 })
      .notNull()
      .references(() => beds.id),

    allocatedAt: datetime("allocated_at", { mode: "date" })
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
    index("idx_seat_alloc_bed").on(t.bedId),
  ]
);
