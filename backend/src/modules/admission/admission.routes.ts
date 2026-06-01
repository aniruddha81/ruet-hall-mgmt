import { Router } from "express";
import {
  authenticateToken,
  authorizeExactRoles,
  authorizeRoles,
} from "../../middlewares/auth.middleware.ts";
import { validateRequest } from "../../middlewares/validateRequest.middleware.ts";
import {
  allocateSeat,
  applyForSeat,
  createSeatCharge,
  getApplications,
  getAvailableRooms,
  getMyStatus,
  reviewApplication,
} from "./admission.controller.ts";
import {
  allocateSeatSchema,
  applyForSeatSchema,
  createSeatChargeSchema,
  listApplicationsSchema,
  listAvailableRoomsSchema,
  reviewApplicationSchema,
} from "./admission.validators.ts";

const admissionRouter = Router();

// ==============================================================
// STUDENT ROUTES
// ==============================================================

admissionRouter.post(
  "/apply",
  authenticateToken,
  authorizeRoles("STUDENT"),
  validateRequest(applyForSeatSchema),
  applyForSeat
);

admissionRouter.get(
  "/my-status",
  authenticateToken,
  authorizeRoles("STUDENT"),
  getMyStatus
);

// ==============================================================
// DSW ROUTES (no PROVOST bypass)
// ==============================================================

admissionRouter.get(
  "/applications",
  authenticateToken,
  authorizeExactRoles("DSW"),
  validateRequest(listApplicationsSchema),
  getApplications
);

admissionRouter.get(
  "/available-rooms",
  authenticateToken,
  authorizeExactRoles("DSW"),
  validateRequest(listAvailableRoomsSchema),
  getAvailableRooms
);

admissionRouter.patch(
  "/review/:id/",
  authenticateToken,
  authorizeExactRoles("DSW"),
  validateRequest(reviewApplicationSchema),
  reviewApplication
);

admissionRouter.post(
  "/applications/:id/seat-charge",
  authenticateToken,
  authorizeExactRoles("DSW"),
  validateRequest(createSeatChargeSchema),
  createSeatCharge
);

admissionRouter.post(
  "/allocate",
  authenticateToken,
  authorizeExactRoles("DSW"),
  validateRequest(allocateSeatSchema),
  allocateSeat
);

export default admissionRouter;
