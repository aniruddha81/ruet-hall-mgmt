import type { Request } from "express";
import ApiError from "../../utils/ApiError.ts";

export const requireAuthenticatedAccount = (req: Request) => {
  if (!req.authAccount) {
    throw new ApiError(401, "Authentication required");
  }

  return req.authAccount;
};

export const requireAdminAccount = (req: Request) => {
  const account = requireAuthenticatedAccount(req);

  if (account.kind !== "ADMIN") {
    throw new ApiError(403, "Only admins can perform this action");
  }

  return account.admin;
};
