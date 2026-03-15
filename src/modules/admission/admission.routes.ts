import { Router } from "express";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middlewares/auth.middleware.ts";
import { validateRequest } from "../../middlewares/validateRequest.middleware.ts";
import {
  allocateSeat,
  applyForSeat,
  getApplications,
  getMyStatus,
  reviewApplication,
} from "./admission.controller.ts";
import {
  allocateSeatSchema,
  applyForSeatSchema,
  listApplicationsSchema,
  reviewApplicationSchema,
} from "./admission.validators.ts";

const admissionRouter = Router();

// ==============================================================
// STUDENT ROUTES
// ==============================================================

// Apply for a hall seat
admissionRouter.post(
  "/apply",
  authenticateToken,
  authorizeRoles("STUDENT"),
  validateRequest(applyForSeatSchema),
  applyForSeat
);

// View own application status
admissionRouter.get(
  "/my-status",
  authenticateToken,
  authorizeRoles("STUDENT"),
  getMyStatus
);

// ==============================================================
// ADMIN ROUTES
// ==============================================================

// List all applications (with filters)
admissionRouter.get(
  "/applications",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY"),
  validateRequest(listApplicationsSchema),
  getApplications
);

// Review (approve / reject / waitlist)
admissionRouter.patch(
  "/review/:id/",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY"),
  validateRequest(reviewApplicationSchema),
  reviewApplication
);

// Allocate seat to approved student
admissionRouter.post(
  "/allocate",
  authenticateToken,
  authorizeRoles("ASST_INVENTORY"),
  validateRequest(allocateSeatSchema),
  allocateSeat
);

export default admissionRouter;
