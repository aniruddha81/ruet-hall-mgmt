import type { NextFunction, Request, Response } from "express";
import { NODE_ENV } from "../Constants.ts";

export const handleError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: err.success ?? false,
    data: err.data ?? null,
    message,
    ...(err.errors && err.errors.length > 0 && { errors: err.errors }),
    ...(NODE_ENV === "development" && { stack: err.stack }),
  });
};
