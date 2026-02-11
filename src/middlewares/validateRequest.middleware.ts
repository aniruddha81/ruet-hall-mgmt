import type { Request, Response, NextFunction } from "express";
import { ZodError, ZodType } from "zod";
import { ApiError } from "../utils/ApiError";

type ValidationSchemas = Partial<{
  body: ZodType;
  params: ZodType;
  query: ZodType;
  cookies: ZodType;
  headers: ZodType;
}>;

type RequestKey = keyof ValidationSchemas;


/** * Middleware to validate incoming requests against provided Zod schemas
 * - Validates body, params, query, cookies, and headers based on the schemas defined in the route
 * - On validation failure, responds with a 400 status and detailed error messages  
 * - On success, attaches the validated data back to the request object for downstream handlers
*/

export const validateRequest =
  (schemas: ValidationSchemas) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const keys = Object.keys(schemas) as RequestKey[];

      for (const key of keys) {
        const schema = schemas[key];
        if (!schema) continue;

        const result = await schema.safeParseAsync(req[key]);

        if (!result.success) {
          return next(formatZodError(result.error));
        }

        // Safe overwrite of validated data
        (req as any)[key] = result.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  };

const formatZodError = (error: ZodError) => {
  const formattedErrors = error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

  return new ApiError(
    400,
    formattedErrors[0]?.message || "Validation error",
    formattedErrors
  );
};
