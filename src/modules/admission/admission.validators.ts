import { z } from "zod";
import {
  ACADEMIC_DEPARTMENTS,
  HALLS,
  SEAT_APPLICATION_STATUSES,
} from "../../types/enums";

// Student: apply for a seat
export const applyForSeatSchema = {
  body: z.object({
    hall: z.enum(HALLS).describe("Hall to apply for"),
    academicDepartment: z.enum(ACADEMIC_DEPARTMENTS).describe("Academic department"),
    session: z
      .string()
      .min(4, "Session is required")
      .max(10)
      .describe("Academic session e.g. 2023-24"),
  }),
};

// Admin: list applications
export const listApplicationsSchema = {
  query: z.object({
    hall: z.enum(HALLS).optional().describe("Filter by hall"),
    status: z
      .enum(SEAT_APPLICATION_STATUSES)
      .optional()
      .describe("Filter by status"),
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v) : 1))
      .refine((v) => v >= 1, "Page must be at least 1"),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v) : 20))
      .refine((v) => v > 0 && v <= 100, "Limit must be between 1 and 100"),
  }),
};

// Admin: review (approve/reject/waitlist)
export const reviewApplicationSchema = {
  params: z.object({
    id: z.uuid("Invalid application ID"),
  }),
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED", "WAITLIST"] as const),
  }),
};

// Admin: allocate seat
export const allocateSeatSchema = {
  body: z.object({
    applicationId: z.uuid("Invalid application ID"),
    bedId: z.uuid("Invalid bed ID"),
    rollNumber: z.string().min(1, "Roll number is required"),
  }),
};
