import type { Request, Response } from "express";
import type { Role } from "../../types/enums.ts";

type AccessTokenPayload = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  rollNumber?: string;
};

/**
 * Refresh tokens deliberately carry only the minimum needed to look the
 * user up again at renewal time. Email/name/etc. live on the access token
 * (and are re-derived from the live DB row on every renewal), so role or
 * profile changes take effect on the very next refresh — no stale data
 * survives in a long-lived JWT.
 */
type RefreshTokenPayload = {
  userId: string;
  role: Role;
  jti: string;
};

type IssueAuthOptions = {
  req: Request;
  res: Response;
  tokenPayload: AccessTokenPayload;
  cookiePath?: string;
};

export type {
  AccessTokenPayload,
  IssueAuthOptions,
  RefreshTokenPayload,
};
