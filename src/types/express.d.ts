import type { Role } from "./roles";

// Extend Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string; role: Role };
    }
  }
}

export {};
