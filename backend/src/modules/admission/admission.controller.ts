import { randomUUID } from "crypto";
import { and, count, desc, eq, inArray, lt, notInArray } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db/index.ts";
import {
  hallAdmins,
  rooms,
  seatAllocations,
  seatApplications,
  studentDues,
  uniStudents,
} from "../../db/models/index.ts";
import type { Hall, SeatApplicationStatus } from "../../types/enums.ts";
import ApiError from "../../utils/ApiError.ts";
import ApiResponse from "../../utils/ApiResponse.ts";
import { getSeatChargeForApplication } from "./admission.service.ts";

const isDsw = (designation: string | undefined) => designation === "DSW";

// ========================
// STUDENT
// ========================

/**
 * POST /api/admission/apply
 * Student submits a seat application (no hall preference)
 */
export const applyForSeat = async (req: Request, res: Response) => {
  const { userId: studentId, rollNumber } = req.user!;

  if (!rollNumber) {
    throw new ApiError(400, "Roll number is required to apply for a seat");
  }

  const { academicDepartment, session } = req.body;

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
    academicDepartment,
    session,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id,
        hall: null,
        academicDepartment,
        session,
        status: "PENDING",
      },
      "Application submitted successfully"
    )
  );
};

/**
 * GET /api/admission/my-status
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

  let roomAllocation = null;
  if (application && seatCharge?.status === "PAID") {
    const [allocation] = await db
      .select({
        roomId: seatAllocations.roomId,
        roomNo: rooms.roomNumber,
        hall: seatAllocations.hall,
        allocatedAt: seatAllocations.allocatedAt,
      })
      .from(seatAllocations)
      .innerJoin(rooms, eq(seatAllocations.roomId, rooms.id))
      .where(eq(seatAllocations.studentId, studentId))
      .limit(1);

    roomAllocation = allocation ?? null;
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        application ? { ...application, seatCharge, roomAllocation } : null,
        "Applications retrieved successfully"
      )
    );
};

// ========================
// DSW (seat allocation)
// ========================

/**
 * GET /api/admission/applications
 * DSW lists all seat applications (all halls)
 */
export const getApplications = async (req: Request, res: Response) => {
  const admin =
    req.authAccount?.type === "ADMIN" ? req.authAccount.admin : null;

  if (!admin || !isDsw(admin.designation)) {
    throw new ApiError(403, "Only DSW can access seat applications");
  }

  const status = req.query.status as SeatApplicationStatus | undefined;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const whereClause = status ? eq(seatApplications.status, status) : undefined;

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

      let roomAllocation = null;
      if (seatCharge?.status === "PAID") {
        const [allocation] = await db
          .select({
            roomId: seatAllocations.roomId,
            roomNo: rooms.roomNumber,
            hall: seatAllocations.hall,
            allocatedAt: seatAllocations.allocatedAt,
            allocatedByName: hallAdmins.name,
          })
          .from(seatAllocations)
          .innerJoin(rooms, eq(seatAllocations.roomId, rooms.id))
          .innerJoin(hallAdmins, eq(seatAllocations.allocatedBy, hallAdmins.id))
          .where(eq(seatAllocations.studentId, application.studentId))
          .limit(1);

        roomAllocation = allocation ?? null;
      }

      return {
        ...application,
        seatCharge,
        roomAllocation,
        canAllocate:
          application.status === "APPROVED" &&
          seatCharge?.status === "PAID" &&
          !roomAllocation,
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
 * GET /api/admission/available-rooms
 * DSW: rooms with free capacity, grouped by hall (only halls with availability)
 */
export const getAvailableRooms = async (req: Request, res: Response) => {
  const admin =
    req.authAccount?.type === "ADMIN" ? req.authAccount.admin : null;

  if (!admin || !isDsw(admin.designation)) {
    throw new ApiError(403, "Only DSW can list available rooms");
  }

  const hallFilter = req.query.hall as Hall | undefined;

  const availableRooms = await db
    .select({
      id: rooms.id,
      roomNumber: rooms.roomNumber,
      hall: rooms.hall,
      capacity: rooms.capacity,
      currentOccupancy: rooms.currentOccupancy,
      status: rooms.status,
    })
    .from(rooms)
    .where(
      and(
        hallFilter ? eq(rooms.hall, hallFilter) : undefined,
        lt(rooms.currentOccupancy, rooms.capacity),
        notInArray(rooms.status, ["MAINTENANCE", "RESERVED"])
      )
    )
    .orderBy(rooms.hall, rooms.roomNumber);

  const hallsWithRooms = [...new Set(availableRooms.map((r) => r.hall))];

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { halls: hallsWithRooms, rooms: availableRooms },
        "Available rooms retrieved successfully"
      )
    );
};

/**
 * PATCH /api/admission/review/:id
 * DSW reviews and updates application status (approve/reject)
 */
export const reviewApplication = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { status } = req.body;
  const admin =
    req.authAccount?.type === "ADMIN" ? req.authAccount.admin : null;

  if (!admin || !isDsw(admin.designation)) {
    throw new ApiError(403, "Only DSW can review applications");
  }

  const [app] = await db
    .select()
    .from(seatApplications)
    .where(eq(seatApplications.id, id))
    .limit(1);

  if (!app) throw new ApiError(404, "Application not found");

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
 * POST /api/admission/applications/:id/seat-charge
 * DSW creates seat allocation charge for an approved application
 */
export const createSeatCharge = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { amount, hall } = req.body as { amount: number; hall: Hall };
  const admin =
    req.authAccount?.type === "ADMIN" ? req.authAccount.admin : null;

  if (!admin || !isDsw(admin.designation)) {
    throw new ApiError(403, "Only DSW can create seat charges");
  }

  const [app] = await db
    .select()
    .from(seatApplications)
    .where(eq(seatApplications.id, id))
    .limit(1);

  if (!app) throw new ApiError(404, "Application not found");
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
  await db.transaction(async (trx) => {
    await trx.insert(studentDues).values({
      id: chargeId,
      studentId: app.studentId,
      hall,
      type: "RENT",
      amount,
    });

    await trx
      .update(seatApplications)
      .set({ hall })
      .where(eq(seatApplications.id, app.id));
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id: chargeId,
        applicationId: app.id,
        studentId: app.studentId,
        hall,
        type: "RENT",
        amount,
        status: "UNPAID",
      },
      "Seat allocation charge created successfully"
    )
  );
};

/**
 * POST /api/admission/allocate
 * DSW allocates a room from any hall with available seats
 */
export const allocateSeat = async (req: Request, res: Response) => {
  const { applicationId, roomId } = req.body;
  const admin =
    req.authAccount?.type === "ADMIN" ? req.authAccount.admin : null;

  if (!admin || !isDsw(admin.designation)) {
    throw new ApiError(403, "Only DSW can allocate seats");
  }

  const [app] = await db
    .select()
    .from(seatApplications)
    .where(eq(seatApplications.id, applicationId))
    .limit(1);

  if (!app) throw new ApiError(404, "Application not found");
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

  const [room] = await db
    .select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);

  if (!room) throw new ApiError(404, "Room not found");
  if (room.status === "MAINTENANCE" || room.status === "RESERVED") {
    throw new ApiError(400, "Room is not available for seat allocation");
  }
  if (room.currentOccupancy >= room.capacity) {
    throw new ApiError(400, "Room is already full");
  }

  const allocationHall = room.hall;
  const allocationId = randomUUID();

  await db.transaction(async (trx) => {
    await trx.insert(seatAllocations).values({
      id: allocationId,
      studentId: app.studentId,
      hall: allocationHall,
      roomId,
      allocatedBy: admin.id,
      rollNumber: app.rollNumber,
    });

    const [existingStudent] = await trx
      .select()
      .from(uniStudents)
      .where(eq(uniStudents.id, app.studentId))
      .limit(1);

    if (!existingStudent) {
      throw new ApiError(404, "Student record not found");
    }

    await trx
      .update(seatApplications)
      .set({ hall: allocationHall })
      .where(eq(seatApplications.id, app.id));

    await trx
      .update(uniStudents)
      .set({
        hall: allocationHall,
        roomId,
        isAllocated: true,
        status: "ACTIVE",
      })
      .where(eq(uniStudents.id, app.studentId));

    const nextOccupancy = room.currentOccupancy + 1;
    await trx
      .update(rooms)
      .set({
        currentOccupancy: nextOccupancy,
        status: nextOccupancy >= room.capacity ? "OCCUPIED" : room.status,
      })
      .where(eq(rooms.id, roomId));
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        allocationId,
        studentId: app.studentId,
        hall: allocationHall,
        roomId,
      },
      "Seat allocated successfully"
    )
  );
};
