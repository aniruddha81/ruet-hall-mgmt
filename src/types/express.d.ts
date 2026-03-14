import type { InferSelectModel } from "drizzle-orm";
import type { hallAdmins, uniStudents } from "../db/models";
import type { Hall, Role } from "./enums";

type StudentRecord = InferSelectModel<typeof uniStudents>;
type HallAdminRecord = InferSelectModel<typeof hallAdmins>;
type AdminRole = Exclude<Role, "STUDENT">;

type AuthenticatedStudentUser = {
  userId: string;
  email: string;
  name: string;
  role: "STUDENT";
  rollNumber?: string;
  hall?: Hall | null;
};

type AuthenticatedAdminUser = {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  rollNumber?: never;
  hall: Hall;
};

type AuthenticatedUser = AuthenticatedStudentUser | AuthenticatedAdminUser;

// Extend Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;

      authAccount?:
        | {
            kind: "STUDENT";
            student: StudentRecord;
          }
        | {
            kind: "ADMIN";
            admin: HallAdminRecord;
          };
    }
  }
}

export {};
