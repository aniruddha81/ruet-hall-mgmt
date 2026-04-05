import { z } from "zod";
import {
  DAMAGE_REPORT_STATUSES,
  HALLS,
} from "../../types/enums.ts";

// List rooms
export const listRoomsSchema = {
  query: z.object({
    hall: z.enum(HALLS).optional(),
    status: z
      .enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RESERVED"] as const)
      .optional(),
  }),
};

// Report damage complaint (student)
export const reportDamageSchema = {
  body: z.object({
    locationDescription: z.string().trim().min(5).max(1000),
    assetDetails: z.string().trim().min(5).max(1000),
  }),
};

// Verify damage
export const verifyDamageSchema = {
  params: z.object({
    id: z.uuid("Invalid damage report ID"),
  }),
  body: z
    .object({
      isStudentResponsible: z.boolean(),
      fineAmount: z.number().int().min(0).optional(),
      damageCost: z.number().int().min(0).optional(),
      managerNote: z.string().trim().min(3).max(1000).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.isStudentResponsible && data.fineAmount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fine amount is required when student is responsible",
          path: ["fineAmount"],
        });
      }

      if (!data.isStudentResponsible && data.damageCost === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Damage cost is required when student is not responsible",
          path: ["damageCost"],
        });
      }

      if (data.isStudentResponsible && data.damageCost !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Damage cost cannot be set when student is responsible",
          path: ["damageCost"],
        });
      }

      if (!data.isStudentResponsible && data.fineAmount !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fine amount cannot be set when student is not responsible",
          path: ["fineAmount"],
        });
      }
    }),
};

// List complaints for inventory managers
export const listDamageReportsSchema = {
  query: z.object({
    status: z.enum(DAMAGE_REPORT_STATUSES).optional(),
  }),
};

// Mark complaint as fixed
export const markDamageFixedSchema = {
  params: z.object({
    id: z.uuid("Invalid damage report ID"),
  }),
};
