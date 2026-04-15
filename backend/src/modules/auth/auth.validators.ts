import { z } from "zod";
import {
  ACADEMIC_DEPARTMENTS,
  HALL_ADMIN_STATUSES,
  HALLS,
  STAFF_ROLES,
} from "../../types/enums.ts";

// Common password strength rules used during registration
const passwordStrengthSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

/**
 * Validation schema for user registration
 * - Ensures name length
 * - Validates email format
 * - Enforces strong password
 * - Role defaults to "STUDENT" with max length aligned to DB
 */
const studentRegisterSchema = {
  body: z
    .object({
      name: z.string().min(2, "Name must be at least 2 characters").max(255),
      email: z.email("Invalid email address"),
      password: passwordStrengthSchema,
      confirmPassword: passwordStrengthSchema,
      rollNumber: z.number().int(),
      academicDepartment: z.enum(ACADEMIC_DEPARTMENTS),
      session: z
        .string()
        .min(4, "Session is required")
        .max(10, "Session cannot exceed 10 characters"),
      phone: z.string().max(20),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
};

/**
 * Validation schema for user login
 * - Validates email format
 * - Requires a non-empty password
 * Note: We don't enforce strength here to avoid leaking rules during login
 */
const studentLoginSchema = {
  body: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
};

const STAFF_ROLES_WITHOUT_PROVOST = STAFF_ROLES.filter(
  (role) => role !== "PROVOST"
) as [string, ...string[]];

const adminRegisterSchema = {
  body: z
    .object({
      name: z.string().min(2, "Name must be at least 2 characters").max(255),
      email: z.email("Invalid email address"),
      password: passwordStrengthSchema,
      confirmPassword: passwordStrengthSchema,
      academicDepartment: z.enum(ACADEMIC_DEPARTMENTS).optional(),
      hall: z.enum(HALLS),
      designation: z.enum(STAFF_ROLES_WITHOUT_PROVOST),
      phone: z.string().max(20),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
};

const adminApprovalSchema = {
  body: z.object({
    adminApplicationId: z.uuid("Invalid application ID"),
    status: z.enum(HALL_ADMIN_STATUSES),
  }),
};

const adminLoginSchema = {
  body: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
};

const createAcademicSessionSchema = {
  body: z.object({
    label: z
      .string()
      .min(4, "Session label must be at least 4 characters")
      .max(10, "Session label cannot exceed 10 characters"),
  }),
};

const updateAcademicSessionSchema = {
  params: z.object({
    sessionId: z.uuid("Invalid session ID"),
  }),
  body: z
    .object({
      label: z
        .string()
        .min(4, "Session label must be at least 4 characters")
        .max(10, "Session label cannot exceed 10 characters")
        .optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
};

/**
 * Validation schema for endpoints that expect a refresh token in cookies
 */
const refreshTokenCookieSchema = {
  cookies: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
};

export {
  adminApprovalSchema,
  adminLoginSchema,
  adminRegisterSchema,
  createAcademicSessionSchema,
  refreshTokenCookieSchema,
  studentLoginSchema,
  studentRegisterSchema,
  updateAcademicSessionSchema,
};
