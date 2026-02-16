import type { Role } from "./enums";

type BaseUser = {
  userId: string;
  email: string;
  name: string;
  role: "STUDENT";
  rollNumber: string;
};

type OtherUser = BaseUser & {
  role: Exclude<Role, "STUDENT">;
};

type AuthUser = BaseUser | OtherUser;

// Extend Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
