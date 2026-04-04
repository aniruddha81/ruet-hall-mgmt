import { Router } from "express";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middlewares/auth.middleware.ts";
import { validateRequest } from "../../middlewares/validateRequest.middleware.ts";
import {
  createAsset,
  getRooms,
  reportDamage,
  verifyDamage,
} from "./inventory.controller.ts";
import {
  createAssetSchema,
  listRoomsSchema,
  reportDamageSchema,
  verifyDamageSchema,
} from "./inventory.validators.ts";

const inventoryRouter = Router();

// ==============================================================
// ROOM MANAGEMENT
// ==============================================================

inventoryRouter.get(
  "/rooms",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY"),
  validateRequest(listRoomsSchema),
  getRooms
);

// ==============================================================
// ASSET MANAGEMENT
// ==============================================================

inventoryRouter.post(
  "/assets",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY"),
  validateRequest(createAssetSchema),
  createAsset
);

// ==============================================================
// DAMAGE REPORTS
// ==============================================================

inventoryRouter.post(
  "/damage",
  authenticateToken,
  authorizeRoles("STUDENT"),
  validateRequest(reportDamageSchema),
  reportDamage
);

inventoryRouter.patch(
  "/damage/verify/:id",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY"),
  validateRequest(verifyDamageSchema),
  verifyDamage
);

export default inventoryRouter;
