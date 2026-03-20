import type { Role } from "../../types/enums.ts";
import type { Request, Response } from "express";

type AccessTokenPayload = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  rollNumber?: string;
};

type RefreshTokenPayload = AccessTokenPayload & {
  jti: string;
};

type IssueAuthOptions = {
  req: Request;
  res: Response;
  tokenPayload: AccessTokenPayload;
  cookiePath?: string;
  accessMaxAge?: number;
  refreshMaxAge?: number;
};
