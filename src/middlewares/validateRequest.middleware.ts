import { z, type ZodType } from "zod";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

/**
 * Recursively collect all error messages from a treeified Zod error
 */
const collectErrors = (node: any, acc: string[] = []): string[] => {
  if (!node) return acc;

  if (Array.isArray(node.errors)) {
    acc.push(...node.errors);
  }

  if (node.properties) {
    Object.values(node.properties).forEach((child) =>
      collectErrors(child, acc)
    );
  }

  if (node.items) {
    node.items.forEach((child: any) => collectErrors(child, acc));
  }

  return acc;
};

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
      const tree = z.treeifyError(result.error);
      const flatErrors = collectErrors(tree);

      throw new ApiError(400, flatErrors.join(", "), flatErrors);
    }

    next();
  };
};
