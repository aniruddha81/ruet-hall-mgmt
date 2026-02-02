import { z } from "zod";
import { ROLES } from "../../types/roles";

// Common password strength rules used during registration
const passwordStrengthSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

// Allowed roles for registration/login
const RoleEnum = z.enum(ROLES);

/**
 * Validation schema for user registration
 * - Ensures name length
 * - Validates email format
 * - Enforces strong password
 * - Optional role (defaults to "STUDENT") with max length aligned to DB
 */
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(255),
    email: z.email("Invalid email address"),
    password: passwordStrengthSchema,
    confirmPassword: passwordStrengthSchema,
    role: RoleEnum.optional().default("STUDENT"),
    avatarUrl: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Validation schema for user login
 * - Validates email format
 * - Requires a non-empty password
 * Note: We don't enforce strength here to avoid leaking rules during login
 */
const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Validation schema for endpoints that expect a refresh token in cookies
 */
const refreshTokenCookieSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export { loginSchema, refreshTokenCookieSchema, registerSchema, RoleEnum };
