import { Router } from "express";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middlewares/auth.middleware.ts";
import { validateRequest } from "../../middlewares/validateRequest.middleware.ts";
import {
  getDamageReports,
  getRooms,
  markDamageFixed,
  reportDamage,
  verifyDamage,
} from "./inventory.controller.ts";
import {
  listDamageReportsSchema,
  listRoomsSchema,
  markDamageFixedSchema,
  reportDamageSchema,
  verifyDamageSchema,
} from "./inventory.validators.ts";

const inventoryRouter = Router();
const inventoryManagerRoles = [
  "ASST_INVENTORY",
  "INVENTORY_SECTION_OFFICER",
] as const;

// ==============================================================
// ROOM MANAGEMENT
// ==============================================================

inventoryRouter.get(
  "/rooms",
  authenticateToken,
  authorizeRoles(...inventoryManagerRoles),
  validateRequest(listRoomsSchema),
  getRooms
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

inventoryRouter.get(
  "/damage",
  authenticateToken,
  authorizeRoles(...inventoryManagerRoles),
  validateRequest(listDamageReportsSchema),
  getDamageReports
);

inventoryRouter.patch(
  "/damage/:id/verify",
  authenticateToken,
  authorizeRoles(...inventoryManagerRoles),
  validateRequest(verifyDamageSchema),
  verifyDamage
);

// Backward-compatible route shape
inventoryRouter.patch(
  "/damage/verify/:id",
  authenticateToken,
  authorizeRoles(...inventoryManagerRoles),
  validateRequest(verifyDamageSchema),
  verifyDamage
);

inventoryRouter.patch(
  "/damage/:id/fix",
  authenticateToken,
  authorizeRoles(...inventoryManagerRoles),
  validateRequest(markDamageFixedSchema),
  markDamageFixed
);

export default inventoryRouter;
