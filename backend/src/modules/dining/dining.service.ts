import type { Request } from "express";
import ApiError from "../../utils/ApiError.ts";

export const requireStudentAccount = (req: Request) => {
  if (req.authAccount?.type !== "STUDENT") {
    throw new ApiError(401, "Student authentication required");
  }

  return req.authAccount.student;
};

export const requireAdminAccount = (req: Request) => {
  if (req.authAccount?.type !== "ADMIN") {
    throw new ApiError(401, "Admin authentication required");
  }

  return req.authAccount.admin;
};
