import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/ApiError";

export const validateRequest = (schema: ZodType) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const incomingPayload = {
      ...req.body,
      ...req.cookies,
      ...req.params,
      ...req.query,
    };

    const result = schema.safeParse(incomingPayload);

    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      throw new ApiError(
        400,
        formattedErrors[0]?.message || "Validation error",
        formattedErrors
      );
    }

    next();
  };
};
