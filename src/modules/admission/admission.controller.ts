import { randomUUID } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db";
import {
  hallAdmins,
  hallStudents,
  seatAllocations,
  seatApplications,
  users,
} from "../../db/models";
import { beds } from "../../db/models/inventory.models";
import type { Hall, SeatApplicationStatus } from "../../types/enums";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

// ========================
// STUDENT
// ========================

/**
 * POST /api/v1/admission/apply
 * Student submits a seat application for a hall
 */
export const applyForSeat = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user!.userId;
    const { hall, department, session } = req.body;

    // Check if user already has a pending/approved application
    const [existing] = await db
      .select()
      .from(seatApplications)
      .where(
        and(
          eq(seatApplications.studentId, studentId),
          sql`${seatApplications.status} IN ('PENDING', 'APPROVED')`
        )
      )
      .limit(1);

    if (existing) {
      throw new ApiError(
        409,
        "You already have a pending or approved application"
      );
    }

    // Check if already allocated in hallStudents
    const [alreadyAllocated] = await db
      .select()
      .from(hallStudents)
      .where(eq(hallStudents.userId, studentId))
      .limit(1);

    if (alreadyAllocated && alreadyAllocated.hall) {
      throw new ApiError(409, "You already have a hall seat allocated");
    }

    const id = randomUUID();
    await db.insert(seatApplications).values({
      id,
      studentId,
      hall,
      department,
      session,
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { id, hall, department, session, status: "PENDING" },
          "Application submitted successfully"
        )
      );
  }
);

/**
 * GET /api/v1/admission/my-status
 * Student views own application history
 */
export const getMyStatus = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.userId;

  const applications = await db
    .select({
      id: seatApplications.id,
      hall: seatApplications.hall,
      department: seatApplications.department,
      session: seatApplications.session,
      status: seatApplications.status,
      createdAt: seatApplications.createdAt,
      reviewedAt: seatApplications.reviewedAt,
    })
    .from(seatApplications)
    .where(eq(seatApplications.studentId, studentId))
    .orderBy(sql`${seatApplications.createdAt} DESC`);

  res
    .status(200)
    .json(
      new ApiResponse(200, applications, "Applications retrieved successfully")
    );
});

// ========================
// ADMIN
// ========================

/**
 * GET /api/v1/admission/applications
 * Admin lists applications with optional hall/status filters + pagination
 */
export const getApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const hall = req.query.hall as Hall | undefined;
    const status = req.query.status as SeatApplicationStatus | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (hall) conditions.push(eq(seatApplications.hall, hall));
    if (status) conditions.push(eq(seatApplications.status, status));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const apps = await db
      .select({
        id: seatApplications.id,
        studentId: seatApplications.studentId,
        studentName: users.name,
        studentEmail: users.email,
        hall: seatApplications.hall,
        department: seatApplications.department,
        session: seatApplications.session,
        status: seatApplications.status,
        createdAt: seatApplications.createdAt,
        reviewedAt: seatApplications.reviewedAt,
      })
      .from(seatApplications)
      .innerJoin(users, eq(seatApplications.studentId, users.id))
      .where(whereClause)
      .orderBy(sql`${seatApplications.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(seatApplications)
      .where(whereClause);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          applications: apps,
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
  }
);

/**
 * PATCH /api/v1/admission/:id/review
 * Provost reviews (approve / reject / waitlist) an application
 * reviewedBy → hallAdmins.id
 */
export const reviewApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body;
    const userId = req.user!.userId;

    // Resolve hallAdmin record for reviewedBy FK
    const [admin] = await db
      .select()
      .from(hallAdmins)
      .where(eq(hallAdmins.userId, userId))
      .limit(1);

    if (!admin) throw new ApiError(403, "Hall admin record not found");

    const [app] = await db
      .select()
      .from(seatApplications)
      .where(eq(seatApplications.id, id))
      .limit(1);

    if (!app) throw new ApiError(404, "Application not found");

    if (app.status !== "PENDING" && app.status !== "WAITLIST") {
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
        new ApiResponse(
          200,
          { id, status },
          "Application reviewed successfully"
        )
      );
  }
);

/**
 * POST /api/v1/admission/allocate
 * Provost allocates a bed to an approved applicant
 * allocatedBy → hallAdmins.id
 */
export const allocateSeat = asyncHandler(
  async (req: Request, res: Response) => {
    const { applicationId, bedId } = req.body;
    const userId = req.user!.userId;

    // Resolve hallAdmin record for allocatedBy FK
    const [admin] = await db
      .select()
      .from(hallAdmins)
      .where(eq(hallAdmins.userId, userId))
      .limit(1);

    if (!admin) throw new ApiError(403, "Hall admin record not found");

    const [app] = await db
      .select()
      .from(seatApplications)
      .where(eq(seatApplications.id, applicationId))
      .limit(1);

    if (!app) throw new ApiError(404, "Application not found");
    if (app.status !== "APPROVED")
      throw new ApiError(400, "Application must be approved before allocation");

    const [bed] = await db
      .select()
      .from(beds)
      .where(eq(beds.id, bedId))
      .limit(1);

    if (!bed) throw new ApiError(404, "Bed not found");
    if (bed.status !== "AVAILABLE")
      throw new ApiError(400, "Bed is not available");
    if (bed.hall !== app.hall)
      throw new ApiError(400, "Bed does not belong to the applied hall");

    const allocationId = randomUUID();

    // Create allocation record
    await db.insert(seatAllocations).values({
      id: allocationId,
      studentId: app.studentId,
      hall: app.hall,
      roomNumber: String(bed.roomNumber),
      bedId,
      allocatedBy: admin.id,
    });

    // Mark bed as occupied
    await db.update(beds).set({ status: "OCCUPIED" }).where(eq(beds.id, bedId));

    // Create or update hallStudents entry
    const [existingStudent] = await db
      .select()
      .from(hallStudents)
      .where(eq(hallStudents.userId, app.studentId))
      .limit(1);

    if (existingStudent) {
      await db
        .update(hallStudents)
        .set({ hall: app.hall, roomNumber: bed.roomNumber, status: "ACTIVE" })
        .where(eq(hallStudents.userId, app.studentId));
    } else {
      await db.insert(hallStudents).values({
        id: randomUUID(),
        userId: app.studentId,
        rollNumber: Date.now(), // temporary — should be set properly
        session: app.session,
        hall: app.hall,
        roomNumber: bed.roomNumber,
        status: "ACTIVE",
      });
    }

    res.status(201).json(
      new ApiResponse(
        201,
        {
          allocationId,
          studentId: app.studentId,
          hall: app.hall,
          roomNumber: bed.roomNumber,
          bedId,
        },
        "Seat allocated successfully"
      )
    );
  }
);
