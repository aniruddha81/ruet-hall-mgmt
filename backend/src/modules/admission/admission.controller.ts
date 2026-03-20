import { randomUUID } from "crypto";
import { and, count, desc, eq, gte, inArray } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db/index.ts";
import {
  seatAllocations,
  seatApplications,
  studentDues,
  uniStudents,
} from "../../db/models/index.ts";
import { beds } from "../../db/models/inventory.models.ts";
import type { SeatApplicationStatus } from "../../types/enums.ts";
import ApiError from "../../utils/ApiError.ts";
import ApiResponse from "../../utils/ApiResponse.ts";
import { getSeatChargeForApplication } from "./admission.service.ts";

// ========================
// STUDENT
// ========================

/**
 * POST /api/v1/admission/apply
 * Student submits a seat application for a hall
 */
export const applyForSeat = async (req: Request, res: Response) => {
  const { userId: studentId, rollNumber } = req.user!;

  if (!rollNumber) {
    throw new ApiError(400, "Roll number is required to apply for a seat");
  }

  const { hall, academicDepartment, session } = req.body;

  // Check if user already has a pending/approved application
  const [existing] = await db
    .select()
    .from(seatApplications)
    .where(
      and(
        eq(seatApplications.studentId, studentId),
        inArray(seatApplications.status, ["PENDING", "APPROVED"])
      )
    )
    .limit(1);

  if (existing) {
    throw new ApiError(
      409,
      "You already have a pending or approved application"
    );
  }

  // Check if already allocated in uniStudents
  const [alreadyAllocated] = await db
    .select()
    .from(uniStudents)
    .where(eq(uniStudents.id, studentId))
    .limit(1);

  if (alreadyAllocated?.isAllocated) {
    throw new ApiError(409, "You already have a hall seat allocated");
  }

  const id = randomUUID();
  await db.insert(seatApplications).values({
    id,
    studentId,
    rollNumber,
    hall,
    academicDepartment,
    session,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id,
        hall,
        academicDepartment,
        session,
        status: "PENDING",
      },
      "Application submitted successfully"
    )
  );
};

/**
 * GET /api/v1/admission/my-status
 * Student views own application status history
 */
export const getMyStatus = async (req: Request, res: Response) => {
  const studentId = req.user!.userId;

  const [application] = await db
    .select()
    .from(seatApplications)
    .where(eq(seatApplications.studentId, studentId))
    .orderBy(desc(seatApplications.createdAt))
    .limit(1);

  const seatCharge = application
    ? await getSeatChargeForApplication(application)
    : null;

  res.status(200).json(
    new ApiResponse(
      200,
      application ? { ...application, seatCharge } : null,
      "Applications retrieved successfully"
    )
  );
};

// ========================
// ADMIN
// ========================

/**
 * GET /api/v1/admission/applications
 * Admin lists seat applications with optional hall/status filters + pagination
 */
export const getApplications = async (req: Request, res: Response) => {
  const admin =
    req.authAccount?.kind === "ADMIN" ? req.authAccount.admin : null;

  if (!admin) {
    throw new ApiError(403, "Hall admin record not found");
  }

  const status = req.query.status as SeatApplicationStatus | undefined;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const whereClause = and(
    eq(seatApplications.hall, admin.hall),
    status ? eq(seatApplications.status, status) : undefined
  );

  const apps = await db
    .select({
      id: seatApplications.id,
      studentId: seatApplications.studentId,
      studentName: uniStudents.name,
      studentEmail: uniStudents.email,
      rollNumber: seatApplications.rollNumber,
      hall: seatApplications.hall,
      academicDepartment: seatApplications.academicDepartment,
      session: seatApplications.session,
      status: seatApplications.status,
      createdAt: seatApplications.createdAt,
      reviewedAt: seatApplications.reviewedAt,
    })
    .from(seatApplications)
    .innerJoin(uniStudents, eq(seatApplications.studentId, uniStudents.id))
    .where(whereClause)
    .orderBy(desc(seatApplications.createdAt))
    .limit(limit)
    .offset(offset);

  const applications = await Promise.all(
    apps.map(async (application) => {
      const seatCharge = await getSeatChargeForApplication(application);

      return {
        ...application,
        seatCharge,
        canAllocate:
          application.status === "APPROVED" && seatCharge?.status === "PAID",
      };
    })
  );

  const [countResult] = await db
    .select({ count: count() })
    .from(seatApplications)
    .where(whereClause);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        applications,
        pagination: {
          page,
          limit,
          total: countResult?.count || 0,
          totalPages: Math.ceil((countResult?.count || 0) / limit),
        },
      },
      "Applications retrieved successfully"
    )
  );
};

/**
 * PATCH /api/v1/admission/review/:id
 * Provost reviews and updates application status (approve/reject)
 */
export const reviewApplication = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { status } = req.body;
  const admin =
    req.authAccount?.kind === "ADMIN" ? req.authAccount.admin : null;

  if (!admin) throw new ApiError(403, "Hall admin record not found");

  const [app] = await db
    .select()
    .from(seatApplications)
    .where(eq(seatApplications.id, id))
    .limit(1);

  if (!app) throw new ApiError(404, "Application not found");
  if (app.hall !== admin.hall) {
    throw new ApiError(403, "Application does not belong to your hall");
  }

  if (app.status !== "PENDING") {
    throw new ApiError(400, "Application has already been reviewed");
  }

  await db
    .update(seatApplications)
    .set({
      status,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    })
    .where(eq(seatApplications.id, id));

  res
    .status(200)
    .json(
      new ApiResponse(200, { id, status }, "Application reviewed successfully")
    );
};

/**
 * POST /api/v1/admission/applications/:id/seat-charge
 * Create the seat allocation charge for an approved application
 */
export const createSeatCharge = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { amount } = req.body;
  const admin =
    req.authAccount?.kind === "ADMIN" ? req.authAccount.admin : null;

  if (!admin) throw new ApiError(403, "Hall admin record not found");

  const [app] = await db
    .select()
    .from(seatApplications)
    .where(eq(seatApplications.id, id))
    .limit(1);

  if (!app) throw new ApiError(404, "Application not found");
  if (app.hall !== admin.hall) {
    throw new ApiError(403, "Application does not belong to your hall");
  }
  if (!app.hall) {
    throw new ApiError(400, "Application hall is missing");
  }
  if (app.status !== "APPROVED") {
    throw new ApiError(400, "Application must be approved before charging");
  }

  const [student] = await db
    .select({ isAllocated: uniStudents.isAllocated })
    .from(uniStudents)
    .where(eq(uniStudents.id, app.studentId))
    .limit(1);

  if (student?.isAllocated) {
    throw new ApiError(409, "Student already has a hall seat allocated");
  }

  const existingSeatCharge = await getSeatChargeForApplication(app);
  if (existingSeatCharge) {
    throw new ApiError(
      409,
      "Seat charge has already been created for this application"
    );
  }

  const chargeId = randomUUID();
  await db.insert(studentDues).values({
    id: chargeId,
    studentId: app.studentId,
    hall: app.hall,
    type: "RENT",
    amount,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id: chargeId,
        applicationId: app.id,
        studentId: app.studentId,
        hall: app.hall,
        type: "RENT",
        amount,
        status: "UNPAID",
      },
      "Seat allocation charge created successfully"
    )
  );
};

/**
 * POST /api/v1/admission/allocate
 * Provost allocates a bed to an approved applicant
 */
export const allocateSeat = async (req: Request, res: Response) => {
  const { applicationId, bedId } = req.body;
  const admin =
    req.authAccount?.kind === "ADMIN" ? req.authAccount.admin : null;

  if (!admin) throw new ApiError(403, "Hall admin record not found");

  const [app] = await db
    .select()
    .from(seatApplications)
    .where(eq(seatApplications.id, applicationId))
    .limit(1);

  if (!app) throw new ApiError(404, "Application not found");
  if (app.hall !== admin.hall) {
    throw new ApiError(403, "Application does not belong to your hall");
  }
  if (!app.hall) {
    throw new ApiError(400, "Application hall is missing");
  }
  if (app.status !== "APPROVED") {
    throw new ApiError(400, "Application must be approved before allocation");
  }

  const seatCharge = await getSeatChargeForApplication(app);
  if (!seatCharge) {
    throw new ApiError(400, "Seat allocation charge has not been created yet");
  }
  if (seatCharge.status !== "PAID") {
    throw new ApiError(
      400,
      "Seat allocation payment must be completed before allocation"
    );
  }

  const [existingAllocation] = await db
    .select({ id: seatAllocations.id })
    .from(seatAllocations)
    .where(eq(seatAllocations.studentId, app.studentId))
    .limit(1);

  if (existingAllocation) {
    throw new ApiError(409, "Student already has a seat allocation");
  }

  const [bed] = await db.select().from(beds).where(eq(beds.id, bedId)).limit(1);

  if (!bed) throw new ApiError(404, "Bed not found");
  if (bed.status !== "AVAILABLE") {
    throw new ApiError(400, "Bed is not available");
  }
  if (bed.hall !== app.hall) {
    throw new ApiError(400, "Bed does not belong to the applied hall");
  }

  const allocationId = randomUUID();

  // Create allocation record
  await db.insert(seatAllocations).values({
    id: allocationId,
    studentId: app.studentId,
    hall: app.hall,
    roomId: bed.roomId,
    bedId,
    allocatedBy: admin.id,
    rollNumber: app.rollNumber,
  });

  // Mark bed as occupied
  await db.update(beds).set({ status: "OCCUPIED" }).where(eq(beds.id, bedId));

  // Update merged uniStudents entry with hall allocation
  const [existingStudent] = await db
    .select()
    .from(uniStudents)
    .where(eq(uniStudents.id, app.studentId))
    .limit(1);

  if (existingStudent) {
    await db
      .update(uniStudents)
      .set({
        hall: app.hall,
        roomId: bed.roomId,
        isAllocated: true,
        status: "ACTIVE",
      })
      .where(eq(uniStudents.id, app.studentId));
  } else {
    throw new ApiError(404, "Student record not found");
  }

  res.status(201).json(
    new ApiResponse(
      201,
      {
        allocationId,
        studentId: app.studentId,
        hall: app.hall,
        roomId: bed.roomId,
        bedId,
      },
      "Seat allocated successfully"
    )
  );
};
