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
  authorizeRoles("ASST_INVENTORY", "PROVOST"),
  validateRequest(listRoomsSchema),
  getRooms
);

inventoryRouter.post(
  "/beds",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY", "PROVOST"),
  validateRequest(createBedsSchema),
  createBeds
);

inventoryRouter.get(
  "/beds",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY", "PROVOST"),
  validateRequest(listBedsSchema),
  getBeds
);

// ==============================================================
// ASSET MANAGEMENT
// ==============================================================

inventoryRouter.post(
  "/assets",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY", "PROVOST"),
  validateRequest(createAssetSchema),
  createAsset
);

// ==============================================================
// DAMAGE REPORTS
// ==============================================================

inventoryRouter.post(
  "/damage",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY", "PROVOST"),
  validateRequest(reportDamageSchema),
  reportDamage
);

inventoryRouter.patch(
  "/damage/:id/verify",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY", "PROVOST"),
  validateRequest(verifyDamageSchema),
  verifyDamage
);

export default inventoryRouter;
