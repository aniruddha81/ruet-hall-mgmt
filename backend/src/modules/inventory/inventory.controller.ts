import { randomUUID } from "crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db/index.ts";
import { uniStudents } from "../../db/models/auth.models.ts";
import { studentDues } from "../../db/models/finance.models.ts";
import { rooms } from "../../db/models/halls.models.ts";
import { damageReports } from "../../db/models/inventory.models.ts";
import type { DamageReportStatus, Hall, RoomStatus } from "../../types/enums.ts";
import ApiError from "../../utils/ApiError.ts";
import ApiResponse from "../../utils/ApiResponse.ts";

type VerifyDamagePayload = {
  isStudentResponsible: boolean;
  fineAmount?: number;
  damageCost?: number;
  managerNote?: string;
};

// ========================
// ROOMS
// ========================

/**
 * GET /api/v1/inventory/rooms
 * List rooms with optional hall/status filters
 */
export const getRooms = async (req: Request, res: Response) => {
  const { hall, status } = req.query as { hall?: Hall; status?: RoomStatus };

  const conditions = [];
  if (hall) conditions.push(eq(rooms.hall, hall));
  if (status) conditions.push(eq(rooms.status, status));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      id: rooms.id,
      roomNumber: rooms.roomNumber,
      hall: rooms.hall,
      capacity: rooms.capacity,
      currentOccupancy: rooms.currentOccupancy,
      status: rooms.status,
    })
    .from(rooms)
    .where(whereClause)
    .orderBy(rooms.roomNumber);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Rooms retrieved successfully"));
};

// ========================
// DAMAGE REPORTS
// ========================

/**
 * POST /api/v1/inventory/damage
 * Student submits a complaint with location + asset details
 */
export const reportDamage = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user || user.role !== "STUDENT") {
    throw new ApiError(403, "Only students can submit damage complaints");
  }

  if (!user.hall) {
    throw new ApiError(400, "Hall information is required to report damage");
  }

  const { locationDescription, assetDetails } = req.body;

  const id = randomUUID();
  const description = `Location: ${locationDescription}\nAsset details: ${assetDetails}`;

  await db.insert(damageReports).values({
    id,
    studentId: user.userId,
    hall: user.hall,
    locationDescription,
    assetDetails,
    description,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id,
        hall: user.hall,
        locationDescription,
        assetDetails,
        status: "REPORTED",
      },
      "Damage complaint submitted successfully"
    )
  );
};

/**
 * GET /api/inventory/damage
 * Inventory manager complaint dashboard (defaults to active complaints)
 */
export const getDamageReports = async (req: Request, res: Response) => {
  const { status } = req.query as { status?: DamageReportStatus };
  const admin =
    req.authAccount?.kind === "ADMIN" ? req.authAccount.admin : null;

  if (!admin) throw new ApiError(403, "Hall admin record not found");

  const conditions = [eq(damageReports.hall, admin.hall)];

  if (status) {
    conditions.push(eq(damageReports.status, status));
  } else {
    conditions.push(inArray(damageReports.status, ["REPORTED", "VERIFIED"]));
  }

  const result = await db
    .select({
      id: damageReports.id,
      studentId: damageReports.studentId,
      hall: damageReports.hall,
      locationDescription: damageReports.locationDescription,
      assetDetails: damageReports.assetDetails,
      description: damageReports.description,
      fineAmount: damageReports.fineAmount,
      damageCost: damageReports.damageCost,
      isStudentResponsible: damageReports.isStudentResponsible,
      managerNote: damageReports.managerNote,
      liableStudentId: damageReports.liableStudentId,
      status: damageReports.status,
      verifiedBy: damageReports.verifiedBy,
      fixedBy: damageReports.fixedBy,
      fixedAt: damageReports.fixedAt,
      createdAt: damageReports.createdAt,
      updatedAt: damageReports.updatedAt,
      reporterName: uniStudents.name,
      reporterRollNumber: uniStudents.rollNumber,
    })
    .from(damageReports)
    .leftJoin(uniStudents, eq(uniStudents.id, damageReports.studentId))
    .where(and(...conditions))
    .orderBy(desc(damageReports.createdAt));

  res
    .status(200)
    .json(
      new ApiResponse(200, result, "Damage complaints retrieved successfully")
    );
};

/**
 * PATCH /api/v1/inventory/damage/verify/:id
 * Admin verifies complaint and decides whether student fine or manager-side cost
 */
export const verifyDamage = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { isStudentResponsible, fineAmount, damageCost, managerNote } =
    req.body as VerifyDamagePayload;
  const admin =
    req.authAccount?.kind === "ADMIN" ? req.authAccount.admin : null;

  if (!admin) throw new ApiError(403, "Hall admin record not found");

  const [report] = await db
    .select()
    .from(damageReports)
    .where(eq(damageReports.id, id))
    .limit(1);

  if (!report) throw new ApiError(404, "Damage report not found");
  if (report.hall !== admin.hall) {
    throw new ApiError(403, "You can only verify complaints in your own hall");
  }

  if (report.status !== "REPORTED") {
    throw new ApiError(400, "Only reported complaints can be verified");
  }

  const updateData: Record<string, unknown> = {
    status: "VERIFIED" as const,
    verifiedBy: admin.id,
    isStudentResponsible,
    managerNote: managerNote ?? null,
    fineAmount: isStudentResponsible ? (fineAmount ?? 0) : null,
    damageCost: isStudentResponsible ? null : (damageCost ?? 0),
    liableStudentId: isStudentResponsible ? report.studentId : null,
    fixedBy: null,
    fixedAt: null,
  };

  let fineDueId: string | null = null;

  await db.transaction(async (trx) => {
    await trx
      .update(damageReports)
      .set(updateData)
      .where(eq(damageReports.id, id));

    if (
      isStudentResponsible &&
      typeof fineAmount === "number" &&
      fineAmount > 0
    ) {
      fineDueId = randomUUID();

      await trx.insert(studentDues).values({
        id: fineDueId,
        studentId: report.studentId,
        hall: report.hall,
        type: "FINE",
        amount: fineAmount,
      });
    }
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        id,
        status: "VERIFIED",
        isStudentResponsible,
        fineAmount: isStudentResponsible ? (fineAmount ?? 0) : null,
        damageCost: isStudentResponsible ? null : (damageCost ?? 0),
        fineDueId,
      },
      "Damage report verified successfully"
    )
  );
};

/**
 * PATCH /api/inventory/damage/:id/fix
 * Mark a verified complaint as fixed (clears active complaint queue)
 */
export const markDamageFixed = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const admin =
    req.authAccount?.kind === "ADMIN" ? req.authAccount.admin : null;

  if (!admin) throw new ApiError(403, "Hall admin record not found");

  const [report] = await db
    .select()
    .from(damageReports)
    .where(eq(damageReports.id, id))
    .limit(1);

  if (!report) throw new ApiError(404, "Damage report not found");
  if (report.hall !== admin.hall) {
    throw new ApiError(
      403,
      "You can only mark complaints as fixed in your own hall"
    );
  }

  if (report.status === "FIXED") {
    throw new ApiError(400, "Complaint is already marked as fixed");
  }

  if (report.status !== "VERIFIED") {
    throw new ApiError(400, "Verify the complaint before marking it fixed");
  }

  const fixedAt = new Date();

  await db
    .update(damageReports)
    .set({
      status: "FIXED",
      fixedBy: admin.id,
      fixedAt,
    })
    .where(eq(damageReports.id, id));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        id,
        status: "FIXED",
        fixedBy: admin.id,
        fixedAt,
      },
      "Damage complaint marked as fixed"
    )
  );
};
