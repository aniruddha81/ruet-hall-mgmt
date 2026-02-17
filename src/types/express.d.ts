import type { Role } from "./enums";

// Extend Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        name: string;
        role: Role;
        rollNumber: string | undefined;
      };
    }
  }
}

export {};
