import { z } from "zod";
import {
  ACADEMIC_DEPARTMENTS,
  HALLS,
  OPERATIONAL_UNITS,
  STAFF_ROLES,
} from "../../types/enums";

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
      session: z.string().max(10),
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

const adminRegisterSchema = {
  body: z
    .object({
      name: z.string().min(2, "Name must be at least 2 characters").max(255),
      email: z.email("Invalid email address"),
      password: passwordStrengthSchema,
      confirmPassword: passwordStrengthSchema,
      academicDepartment: z.enum(ACADEMIC_DEPARTMENTS),
      hall: z.enum(HALLS),
      designation: z.enum(STAFF_ROLES),
      operationalUnit: z.enum(OPERATIONAL_UNITS),
      phone: z.string().max(20),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
};

const adminLoginSchema = {
  body: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
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
  adminLoginSchema,
  adminRegisterSchema,
  refreshTokenCookieSchema,
  studentLoginSchema,
  studentRegisterSchema,
};
