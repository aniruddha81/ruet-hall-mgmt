import type { Request } from "express";
import ApiError from "../../utils/ApiError.ts";

export const requireStudentAccount = (req: Request) => {
  if (req.authAccount?.kind !== "STUDENT") {
    throw new ApiError(401, "Student authentication required");
  }

  return req.authAccount.student;
};

export const requireAdminAccount = (req: Request) => {
  if (req.authAccount?.kind !== "ADMIN") {
    throw new ApiError(401, "Admin authentication required");
  }

  return req.authAccount.admin;
};
