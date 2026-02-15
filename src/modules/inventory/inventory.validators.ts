import { z } from "zod";
import { ASSET_CONDITIONS, BED_STATUSES, HALLS } from "../../types/enums";

// Create beds for a room
export const createBedsSchema = {
  body: z.object({
    hall: z.enum(HALLS),
    roomNumber: z.number().int().positive(),
    bedLabels: z
      .array(z.string().min(1).max(10))
      .nonempty("At least one bed label required"),
  }),
};

// List beds
export const listBedsSchema = {
  query: z.object({
    hall: z.enum(HALLS).optional(),
    roomNumber: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v) : undefined)),
    status: z.enum(BED_STATUSES).optional(),
  }),
};

// List rooms
export const listRoomsSchema = {
  query: z.object({
    hall: z.enum(HALLS).optional(),
    status: z
      .enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RESERVED"] as const)
      .optional(),
  }),
};

// Create asset
export const createAssetSchema = {
  body: z.object({
    hall: z.enum(HALLS),
    name: z.string().min(1).max(255),
    quantity: z.number().int().positive().default(1),
    condition: z.enum(ASSET_CONDITIONS).default("GOOD"),
  }),
};

// Report damage
export const reportDamageSchema = {
  body: z.object({
    assetId: z.uuid("Invalid asset ID"),
    hall: z.enum(HALLS),
    description: z.string().min(5).max(1000),
  }),
};

// Verify damage
export const verifyDamageSchema = {
  params: z.object({
    id: z.uuid("Invalid damage report ID"),
  }),
  body: z.object({
    fineAmount: z.number().int().min(0).optional(),
  }),
};
