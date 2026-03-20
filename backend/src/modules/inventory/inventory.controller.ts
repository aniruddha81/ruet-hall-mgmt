import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db/index.ts";
import { studentDues } from "../../db/models/finance.models.ts";
import { rooms } from "../../db/models/halls.models.ts";
import { assets, beds, damageReports } from "../../db/models/inventory.models.ts";
import type {
  AssetCondition,
  BedStatus,
  Hall,
  RoomStatus,
} from "../../types/enums.ts";
import ApiError from "../../utils/ApiError.ts";
import ApiResponse from "../../utils/ApiResponse.ts";

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
// BEDS
// ========================

/**
 * POST /api/v1/inventory/beds
 * Create beds for a room (admin)
 */
export const createBeds = async (req: Request, res: Response) => {
  const { hall, roomId, bedLabels } = req.body;

  // Verify room exists
  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.hall, hall), eq(rooms.id, roomId)))
    .limit(1);

  if (!room) throw new ApiError(404, "Room not found");

  const values = (bedLabels as string[]).map((label) => ({
    id: randomUUID(),
    hall: hall as Hall,
    roomId: roomId as string,
    bedLabel: label,
  }));

  await db.insert(beds).values(values);

  res
    .status(201)
    .json(new ApiResponse(201, values, "Beds created successfully"));
};

/**
 * GET /api/v1/inventory/beds
 * List beds with optional hall/roomId/status filters
 */
export const getBeds = async (req: Request, res: Response) => {
  const hall = req.query.hall as Hall | undefined;
  const roomId = req.query.roomId as string | undefined;
  const status = req.query.status as BedStatus | undefined;

  const conditions = [];
  if (hall) conditions.push(eq(beds.hall, hall));
  if (roomId) conditions.push(eq(beds.roomId, roomId));
  if (status) conditions.push(eq(beds.status, status));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      id: beds.id,
      hall: beds.hall,
      roomId: beds.roomId,
      bedLabel: beds.bedLabel,
      status: beds.status,
    })
    .from(beds)
    .where(whereClause)
    .orderBy(beds.roomId, beds.bedLabel);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Beds retrieved successfully"));
};

// ========================
// ASSETS
// ========================

/**
 * POST /api/v1/inventory/assets
 * Create a trackable asset (admin)
 */
export const createAsset = async (req: Request, res: Response) => {
  const { hall, name, quantity, condition } = req.body;

  const id = randomUUID();
  await db.insert(assets).values({
    id,
    hall,
    name,
    quantity,
    condition: condition as AssetCondition,
  });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { id, hall, name, quantity, condition },
        "Asset created successfully"
      )
    );
};

// ========================
// DAMAGE REPORTS
// ========================

/**
 * POST /api/v1/inventory/damage
 * Student reports asset damage
 */
export const reportDamage = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { assetId, hall, description } = req.body;

  const [asset] = await db
    .select()
    .from(assets)
    .where(eq(assets.id, assetId))
    .limit(1);

  if (!asset) throw new ApiError(404, "Asset not found");
  if (asset.hall !== hall)
    throw new ApiError(400, "Asset does not belong to this hall");

  const id = randomUUID();
  await db.insert(damageReports).values({
    id,
    studentId: userId,
    assetId,
    hall,
    description,
  });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { id, assetId, hall, description, status: "REPORTED" },
        "Damage reported successfully"
      )
    );
};

/**
 * PATCH /api/v1/inventory/damage/:id/verify
 * Admin verifies a damage report and assigns fine
 */
export const verifyDamage = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { fineAmount } = req.body;
  const admin =
    req.authAccount?.kind === "ADMIN" ? req.authAccount.admin : null;

  if (!admin) throw new ApiError(403, "Hall admin record not found");

  const [report] = await db
    .select()
    .from(damageReports)
    .where(eq(damageReports.id, id))
    .limit(1);

  if (!report) throw new ApiError(404, "Damage report not found");
  if (report.status === "VERIFIED") throw new ApiError(400, "Already verified");

  const updateData: Record<string, unknown> = {
    status: "VERIFIED" as const,
    verifiedBy: admin.id,
  };
  if (fineAmount !== undefined) updateData.fineAmount = fineAmount;

  let fineDueId: string | null = null;

  await db.transaction(async (trx) => {
    await trx
      .update(damageReports)
      .set(updateData)
      .where(eq(damageReports.id, id));

    if (typeof fineAmount === "number" && fineAmount > 0) {
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

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { id, status: "VERIFIED", fineAmount, fineDueId },
        "Damage report verified successfully"
      )
    );
};
