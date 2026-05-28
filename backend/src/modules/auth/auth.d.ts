import type { Request, Response } from "express";
import type { SessionUserPayload } from "../../lib/sessionStore.ts";

type IssueSessionOptions = {
  req: Request;
  res: Response;
  payload: SessionUserPayload;
  cookiePath?: string;
};

export type { IssueSessionOptions, SessionUserPayload };
