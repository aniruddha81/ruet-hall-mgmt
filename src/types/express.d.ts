import type { Role } from "./roles";

// Extend Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string; name: string; role: Role };
    }
  }
}

export {};
