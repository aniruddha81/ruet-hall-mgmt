import { Router } from "express";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import {
  createAsset,
  createBeds,
  getBeds,
  getRooms,
  reportDamage,
  verifyDamage,
} from "./inventory.controller";
import {
  createAssetSchema,
  createBedsSchema,
  listBedsSchema,
  listRoomsSchema,
  reportDamageSchema,
  verifyDamageSchema,
} from "./inventory.validators";

const inventoryRouter = Router();

// ==============================================================
// ROOM & BED MANAGEMENT
// ==============================================================

inventoryRouter.get(
  "/rooms",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY"),
  validateRequest(listRoomsSchema),
  getRooms
);

inventoryRouter.post(
  "/beds",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY"),
  validateRequest(createBedsSchema),
  createBeds
);

inventoryRouter.get(
  "/beds",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY"),
  validateRequest(listBedsSchema),
  getBeds
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
  "/damage/:id/verify",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY"),
  validateRequest(verifyDamageSchema),
  verifyDamage
);

export default inventoryRouter;
