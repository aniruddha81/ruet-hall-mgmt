import { randomUUID } from "crypto";
import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  not,
  sql,
  sum,
} from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db/index.ts";
import {
  mealItems,
  mealMenuItems,
  mealMenus,
  mealPayments,
  mealTokens,
  uniStudents,
} from "../../db/models/index.ts";
import ApiError from "../../utils/ApiError.ts";
import ApiResponse from "../../utils/ApiResponse.ts";
import { uploadOnCloudinary } from "../../utils/cloudinary.ts";
import { toDateString } from "../../utils/helpers.ts";
import {
  getStudentInfo,
  requestPayment,
  sendReceiptEmail,
} from "../finance/finance.service.ts";
import {
  requireAdminAccount,
  requireStudentAccount,
} from "./dining.service.ts";

const isSupportedReceiptFile = (mimetype?: string) =>
  Boolean(
    mimetype &&
    (mimetype.startsWith("image/") || mimetype === "application/pdf")
  );

const getActiveMealItemsByIds = async (itemIds: string[]) => {
  const uniqueIds = Array.from(new Set(itemIds));
  if (!uniqueIds.length) {
    throw new ApiError(400, "Select at least one meal item");
  }

  const items = await db
    .select({ id: mealItems.id, name: mealItems.name })
    .from(mealItems)
    .where(and(inArray(mealItems.id, uniqueIds), eq(mealItems.isActive, 1)));

  if (items.length !== uniqueIds.length) {
    throw new ApiError(400, "One or more selected meal items are invalid");
  }

  return items;
};

// STUDENT CONTROLLERS - MEAL TOKEN BOOKING & MANAGEMENT

/**
 * GET /api/v1/dining/tomorrow-menus
 * Get tomorrow's lunch and dinner menus for a hall
 */
export const getTomorrowMenus = async (req: Request, res: Response) => {
  const tomorrowDate = toDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const menus = await db
    .select()
    .from(mealMenus)
    .where(sql`${mealMenus.mealDate} = CAST(${tomorrowDate} AS DATE)`);

  const response = {
    lunch: menus.filter((m) => m.mealType === "LUNCH"),
    dinner: menus.filter((m) => m.mealType === "DINNER"),
  };

  res
    .status(200)
    .json(
      new ApiResponse(200, response, "Tomorrow's menus retrieved successfully")
    );
};

/**
 * POST /api/v1/dining/book-tokens
 * Book meal tokens for tomorrow's meal
 */
export const bookMealTokens = async (req: Request, res: Response) => {
  const student = requireStudentAccount(req);
  const { menuId, quantity, paymentMethod } = req.body;

  let bankReceiptUrl: string | null = null;
  if (paymentMethod === "BANK") {
    const receiptFile = req.file;
    if (!receiptFile?.path) {
      throw new ApiError(
        400,
        "Bank receipt file (PDF/Image) is required for BANK payments."
      );
    }

    if (!isSupportedReceiptFile(receiptFile.mimetype)) {
      throw new ApiError(
        400,
        "Only PDF or image files are allowed for bank receipt upload."
      );
    }

    const uploadedReceipt = await uploadOnCloudinary(receiptFile.path);
    if (!uploadedReceipt?.url) {
      throw new ApiError(500, "Failed to upload bank receipt file.");
    }
    bankReceiptUrl = uploadedReceipt.url;
  }

  if (quantity <= 0 || quantity > 20) {
    throw new ApiError(
      400,
      "You can only book between 1 and 20 tokens at a time."
    );
  }

  const tomorrowDate = toDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const tokenId = randomUUID();
  const paymentId = randomUUID();

  // Phase 1: Atomic reservation (lock + check + reserve in one transaction).
  // The conditional UPDATE on booked_tokens prevents race-condition overbooking.
  const reservation = await db.transaction(async (trx) => {
    // NEW: Check existing tokens for this user on this menu
    const [existingTokensResult] = await trx
      .select({ total: sum(mealTokens.quantity) })
      .from(mealTokens)
      .where(
        and(
          eq(mealTokens.studentId, student.id),
          eq(mealTokens.menuId, menuId),
          isNull(mealTokens.cancelledAt)
        )
      );

    const alreadyBooked = Number(existingTokensResult?.total || 0);
    if (alreadyBooked + quantity > 20) {
      throw new ApiError(
        400,
        `You can only book up to 20 tokens per menu. You already have ${alreadyBooked} tokens booked.`
      );
    }

    const [menu] = await trx
      .select()
      .from(mealMenus)
      .where(eq(mealMenus.id, menuId))
      .limit(1);

    if (!menu) {
      throw new ApiError(404, "Menu not found");
    }

    const menuDateStr = toDateString(new Date(menu.mealDate));
    if (menuDateStr !== tomorrowDate) {
      throw new ApiError(400, "Can only book tokens for tomorrow's meals");
    }

    const totalAmount = menu.price * quantity;

    // Atomic availability check + reserve: only succeeds if enough tokens exist.
    // Two concurrent requests cannot both pass this — MySQL row lock on UPDATE.
    const updateResult = await trx.execute(
      sql`UPDATE meal_menus
          SET booked_tokens = booked_tokens + ${quantity}
          WHERE id = ${menuId}
          AND (total_tokens - booked_tokens) >= ${quantity}`
    );

    if ((updateResult as any)[0]?.affectedRows === 0) {
      throw new ApiError(
        400,
        `Not enough tokens available. Cannot book ${quantity} tokens.`
      );
    }

    // Insert payment record (transactionId filled after gateway call)
    await trx.insert(mealPayments).values({
      id: paymentId,
      studentId: student.id,
      amount: totalAmount,
      totalQuantity: quantity,
      paymentMethod,
      bankReceiptUrl,
    });

    // Insert token record
    await trx.insert(mealTokens).values({
      id: tokenId,
      studentId: student.id,
      menuId: menu.id,
      hall: menu.hall,
      mealDate: menu.mealDate,
      mealType: menu.mealType,
      quantity,
      totalAmount,
      paymentId,
    });

    return { totalAmount, mealType: menu.mealType, mealDate: menuDateStr };
  });

  // Phase 2: Process payment gateway (outside transaction, lock released).
  let transactionId: string;
  try {
    transactionId =
      paymentMethod !== "CASH"
        ? await requestPayment("/pay-api/meal-payment", {
            studentId: student.id,
            amount: reservation.totalAmount,
            totalQuantity: quantity,
            paymentMethod,
          })
        : `TXN-MEAL-${student.id}-${Date.now()}`;

    await db
      .update(mealPayments)
      .set({ transactionId })
      .where(eq(mealPayments.id, paymentId));
  } catch (error) {
    // Phase 3: Compensate — undo reservation on payment failure.
    await db.transaction(async (trx) => {
      await trx.delete(mealTokens).where(eq(mealTokens.id, tokenId));
      await trx.delete(mealPayments).where(eq(mealPayments.id, paymentId));
      await trx
        .update(mealMenus)
        .set({ bookedTokens: sql`${mealMenus.bookedTokens} - ${quantity}` })
        .where(eq(mealMenus.id, menuId));
    });
    throw error;
  }

  // Fire-and-forget receipt email
  getStudentInfo(student.id).then((studentInfo) => {
    if (studentInfo) {
      sendReceiptEmail({
        type: "MEAL",
        studentName: studentInfo.name,
        studentEmail: studentInfo.email,
        rollNumber: studentInfo.rollNumber,
        hall: studentInfo.hall || "N/A",
        paymentId,
        transactionId,
        paymentMethod,
        amount: reservation.totalAmount,
        totalQuantity: quantity,
        mealType: reservation.mealType,
        mealDate: reservation.mealDate,
        paymentDate: new Date(),
      });
    }
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        tokenId,
        paymentId,
        quantity,
        totalAmount: reservation.totalAmount,
        mealType: reservation.mealType,
        mealDate: reservation.mealDate,
        transactionId,
        paymentMethod,
        bankReceiptUrl,
        receiptVerifiedAt: null,
      },
      "Meal tokens booked successfully"
    )
  );
};

/**
 * GET /api/v1/dining/my-active-tokens
 * Get student's active tokens for tomorrow's meals
 */
export const getMyActiveTokens = async (req: Request, res: Response) => {
  const student = requireStudentAccount(req);

  const tomorrowDate = toDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const activeTokens = await db
    .select({
      tokenId: mealTokens.id,
      menuId: mealTokens.menuId,
      quantity: mealTokens.quantity,
      totalAmount: mealTokens.totalAmount,
      mealType: mealTokens.mealType,
      mealDate: mealTokens.mealDate,
      bookingTime: mealTokens.bookingTime,
      menuDescription: mealMenus.menuDescription,
      price: mealMenus.price,
    })
    .from(mealTokens)
    .innerJoin(mealMenus, eq(mealTokens.menuId, mealMenus.id))
    .where(
      and(
        eq(mealTokens.studentId, student.id),
        isNull(mealTokens.cancelledAt),
        sql`${mealTokens.mealDate} = CAST(${tomorrowDate} AS DATE)`
      )
    );

  res
    .status(200)
    .json(
      new ApiResponse(200, activeTokens, "Active tokens retrieved successfully")
    );
};

/**
 * PATCH /api/v1/dining/cancel-token/:tokenId
 * Cancel a booked meal token before the meal date
 */
export const cancelMealToken = async (req: Request, res: Response) => {
  const student = requireStudentAccount(req);
  const { tokenId } = req.params as { tokenId: string };

  const [token] = await db
    .select()
    .from(mealTokens)
    .where(eq(mealTokens.id, tokenId))
    .limit(1);

  if (!token) {
    throw new ApiError(404, "Token not found");
  }

  if (token.studentId !== student.id) {
    throw new ApiError(403, "This token does not belong to you");
  }

  if (token.cancelledAt) {
    throw new ApiError(400, "Token has already been cancelled");
  }

  // Cancellation deadline: must be before midnight on the day before the meal
  const now = new Date();
  const nowStr = toDateString(now);
  const mealDayStr = toDateString(new Date(token.mealDate));

  if (nowStr >= mealDayStr) {
    throw new ApiError(400, "Cannot cancel token on or after the meal date");
  }

  // All cancel operations in a single transaction for atomicity
  await db.transaction(async (trx) => {
    await trx
      .update(mealTokens)
      .set({ cancelledAt: now })
      .where(eq(mealTokens.id, tokenId));

    await trx
      .update(mealMenus)
      .set({ bookedTokens: sql`${mealMenus.bookedTokens} - ${token.quantity}` })
      .where(eq(mealMenus.id, token.menuId));

    const [payment] = await trx
      .select()
      .from(mealPayments)
      .where(eq(mealPayments.id, token.paymentId))
      .limit(1);

    if (payment) {
      const newRefundAmount = (payment.refundAmount || 0) + token.totalAmount;
      await trx
        .update(mealPayments)
        .set({
          refundAmount: newRefundAmount,
          refundedAt: now,
        })
        .where(eq(mealPayments.id, token.paymentId));
    }
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        tokenId,
        cancelledAt: now,
        refundAmount: token.totalAmount,
      },
      "Token cancelled successfully"
    )
  );
};

// GET /api/v1/dining/token-history - Get student's token purchase history
export const getMyTokenHistory = async (req: Request, res: Response) => {
  const student = requireStudentAccount(req);
  const { page = 1, limit = 10, status, startDate, endDate } = req.query;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const offset = (pageNum - 1) * limitNum;

  let conditions = [eq(mealTokens.studentId, student.id)];

  if (status === "ACTIVE") {
    conditions.push(isNull(mealTokens.cancelledAt));
  } else if (status === "CANCELLED") {
    conditions.push(not(isNull(mealTokens.cancelledAt)));
  }

  if (startDate) {
    conditions.push(sql`${mealTokens.mealDate} >= CAST(${startDate} AS DATE)`);
  }

  if (endDate) {
    conditions.push(sql`${mealTokens.mealDate} <= CAST(${endDate} AS DATE)`);
  }

  const tokens = await db
    .select({
      tokenId: mealTokens.id,
      quantity: mealTokens.quantity,
      totalAmount: mealTokens.totalAmount,
      mealType: mealTokens.mealType,
      mealDate: mealTokens.mealDate,
      bookingTime: mealTokens.bookingTime,
      cancelledAt: mealTokens.cancelledAt,
      menuDescription: mealMenus.menuDescription,
      price: mealMenus.price,
    })
    .from(mealTokens)
    .innerJoin(mealMenus, eq(mealTokens.menuId, mealMenus.id))
    .where(and(...conditions))
    .orderBy(desc(mealTokens.bookingTime))
    .limit(limitNum)
    .offset(offset);

  const [countResult] = await db
    .select({ count: count() })
    .from(mealTokens)
    .where(and(...conditions));

  const total = countResult?.count || 0;
  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        tokens,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      },
      "Token history retrieved successfully"
    )
  );
};

// GET /api/v1/dining/token/:tokenId - Get token details
export const getMyTokenById = async (req: Request, res: Response) => {
  const student = requireStudentAccount(req);
  const { tokenId } = req.params as { tokenId: string };

  const [tokenDetails] = await db
    .select({
      tokenId: mealTokens.id,
      quantity: mealTokens.quantity,
      totalAmount: mealTokens.totalAmount,
      mealType: mealTokens.mealType,
      mealDate: mealTokens.mealDate,
      bookingTime: mealTokens.bookingTime,
      cancelledAt: mealTokens.cancelledAt,
      menuDescription: mealMenus.menuDescription,
      price: mealMenus.price,
      hall: mealMenus.hall,
      paymentId: mealPayments.id,
      paymentMethod: mealPayments.paymentMethod,
      transactionId: mealPayments.transactionId,
      bankReceiptUrl: mealPayments.bankReceiptUrl,
      receiptVerifiedAt: mealPayments.receiptVerifiedAt,
      receiptVerifiedBy: mealPayments.receiptVerifiedBy,
      paymentDate: mealPayments.paymentDate,
      refundAmount: mealPayments.refundAmount,
      refundedAt: mealPayments.refundedAt,
    })
    .from(mealTokens)
    .innerJoin(mealMenus, eq(mealTokens.menuId, mealMenus.id))
    .innerJoin(mealPayments, eq(mealTokens.paymentId, mealPayments.id))
    .where(
      and(eq(mealTokens.id, tokenId), eq(mealTokens.studentId, student.id))
    )
    .limit(1);

  if (!tokenDetails) {
    throw new ApiError(404, "Token not found or does not belong to you");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, tokenDetails, "Token details retrieved successfully")
    );
};

// DINING MANAGER CONTROLLERS - MENU & BOOKING MANAGEMENT

// POST /api/v1/dining/menu/create - Create menu for tomorrow
export const createTomorrowMenu = async (req: Request, res: Response) => {
  const manager = requireAdminAccount(req);
  const { mealType, mealItemIds, price, totalTokens } = req.body;
  const hall = manager.hall;

  const tomorrowDate = toDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const [alreadyExists] = await db
    .select()
    .from(mealMenus)
    .where(
      and(
        eq(mealMenus.hall, hall),
        eq(mealMenus.mealType, mealType),
        sql`${mealMenus.mealDate} = CAST(${tomorrowDate} AS DATE)`
      )
    )
    .limit(1);

  if (alreadyExists) {
    return res
      .status(409)
      .json(
        new ApiResponse(
          409,
          {},
          "Menu for this hall, date and meal type already exists"
        )
      );
  }

  const id = randomUUID();
  const selectedItems = await getActiveMealItemsByIds(mealItemIds);
  const menuDescription = selectedItems.map((item) => item.name).join(", ");

  await db.transaction(async (tx) => {
    await tx.insert(mealMenus).values({
      id,
      hall: hall,
      mealType,
      menuDescription,
      price,
      totalTokens: totalTokens,
      createdBy: manager.id,
    });

    await tx.insert(mealMenuItems).values(
      selectedItems.map((item) => ({
        id: randomUUID(),
        menuId: id,
        mealItemId: item.id,
      }))
    );
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        menuId: id,
        menuDescription,
        price,
        totalTokens,
        mealType,
        mealDate: tomorrowDate,
      },
      "Menu created successfully for tomorrow"
    )
  );
};

// PATCH /api/v1/dining/menu/:menuId/update - Update tomorrow's menu
export const updateTomorrowMenu = async (req: Request, res: Response) => {
  const { menuId } = req.params as { menuId: string };
  const { mealItemIds, price, totalTokens } = req.body;
  const manager = requireAdminAccount(req);

  const [menu] = await db
    .select()
    .from(mealMenus)
    .where(eq(mealMenus.id, menuId))
    .limit(1);

  if (!menu) {
    throw new ApiError(404, "Menu not found");
  }

  if (menu.hall !== manager.hall) {
    throw new ApiError(403, "Menu does not belong to your hall");
  }

  const tomorrowDate = toDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const menuDateStr = toDateString(new Date(menu.mealDate));

  if (menuDateStr !== tomorrowDate) {
    throw new ApiError(400, "Can only update tomorrow's menu");
  }

  if (price && menu.bookedTokens > 0) {
    throw new ApiError(400, "Cannot update price when bookings already exist");
  }

  if (totalTokens && totalTokens < menu.bookedTokens) {
    throw new ApiError(
      400,
      `Cannot set total tokens below booked tokens (${menu.bookedTokens})`
    );
  }

  const updateData: any = {};

  if (price !== undefined) updateData.price = price;
  if (totalTokens !== undefined) updateData.totalTokens = totalTokens;

  if (mealItemIds !== undefined) {
    const selectedItems = await getActiveMealItemsByIds(mealItemIds);
    updateData.menuDescription = selectedItems
      .map((item) => item.name)
      .join(", ");

    await db.transaction(async (tx) => {
      await tx.delete(mealMenuItems).where(eq(mealMenuItems.menuId, menuId));
      await tx.insert(mealMenuItems).values(
        selectedItems.map((item) => ({
          id: randomUUID(),
          menuId,
          mealItemId: item.id,
        }))
      );
      await tx
        .update(mealMenus)
        .set(updateData)
        .where(eq(mealMenus.id, menuId));
    });
  }

  if (mealItemIds === undefined && Object.keys(updateData).length > 0) {
    await db.update(mealMenus).set(updateData).where(eq(mealMenus.id, menuId));
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { menuId, ...updateData },
        "Menu updated successfully"
      )
    );
};

// DELETE /api/v1/dining/menu/:menuId - Delete tomorrow's menu (only if no bookings)
export const deleteTomorrowMenu = async (req: Request, res: Response) => {
  const { menuId } = req.params as { menuId: string };
  const manager = requireAdminAccount(req);

  const [menu] = await db
    .select()
    .from(mealMenus)
    .where(eq(mealMenus.id, menuId))
    .limit(1);

  if (!menu) {
    throw new ApiError(404, "Menu not found");
  }

  if (menu.hall !== manager.hall) {
    throw new ApiError(403, "Menu does not belong to your hall");
  }

  if (menu.bookedTokens > 0) {
    throw new ApiError(400, "Cannot delete menu with existing bookings");
  }

  await db.delete(mealMenus).where(eq(mealMenus.id, menuId));

  res
    .status(200)
    .json(new ApiResponse(200, { menuId }, "Menu deleted successfully"));
};

// GET /api/v1/dining/menus/tomorrow - View tomorrow's menus
export const getTomorrowMenusList = async (req: Request, res: Response) => {
  const manager = requireAdminAccount(req);

  const tomorrowDate = toDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const menus = await db
    .select({
      menuId: mealMenus.id,
      mealType: mealMenus.mealType,
      menuDescription: mealMenus.menuDescription,
      price: mealMenus.price,
      totalTokens: mealMenus.totalTokens,
      bookedTokens: mealMenus.bookedTokens,
      availableTokens: mealMenus.availableTokens,
      mealDate: mealMenus.mealDate,
      potentialRevenue: sql<number>`${mealMenus.bookedTokens} * ${mealMenus.price}`,
    })
    .from(mealMenus)
    .where(
      and(
        eq(mealMenus.hall, manager.hall),
        sql`${mealMenus.mealDate} = CAST(${tomorrowDate} AS DATE)`
      )
    );

  res
    .status(200)
    .json(
      new ApiResponse(200, menus, "Tomorrow's menus retrieved successfully")
    );
};

// GET /api/v1/dining/menus/today - View today's menus
export const getTodayMenus = async (req: Request, res: Response) => {
  const manager = requireAdminAccount(req);

  const todayDate = toDateString(new Date());

  const menus = await db
    .select({
      menuId: mealMenus.id,
      mealType: mealMenus.mealType,
      menuDescription: mealMenus.menuDescription,
      price: mealMenus.price,
      totalTokens: mealMenus.totalTokens,
      bookedTokens: mealMenus.bookedTokens,
      availableTokens: mealMenus.availableTokens,
      mealDate: mealMenus.mealDate,
      revenue: sql<number>`${mealMenus.bookedTokens} * ${mealMenus.price}`,
    })
    .from(mealMenus)
    .where(
      and(
        eq(mealMenus.hall, manager.hall),
        sql`${mealMenus.mealDate} = CAST(${todayDate} AS DATE)`
      )
    );

  res
    .status(200)
    .json(new ApiResponse(200, menus, "Today's menus retrieved successfully"));
};

// GET /api/v1/dining/meal-items - List meal items for dropdown composition
export const getMealItems = async (_req: Request, res: Response) => {
  const items = await db
    .select({
      id: mealItems.id,
      name: mealItems.name,
      isActive: mealItems.isActive,
      createdBy: mealItems.createdBy,
      updatedBy: mealItems.updatedBy,
      createdAt: mealItems.createdAt,
      updatedAt: mealItems.updatedAt,
    })
    .from(mealItems)
    .orderBy(mealItems.name);

  res
    .status(200)
    .json(new ApiResponse(200, { items }, "Meal items retrieved successfully"));
};

// POST /api/v1/dining/meal-items - Create a new meal item
export const createMealItem = async (req: Request, res: Response) => {
  const manager = requireAdminAccount(req);
  const { name } = req.body;

  const normalizedName = String(name).trim();

  const [existing] = await db
    .select({ id: mealItems.id })
    .from(mealItems)
    .where(eq(mealItems.name, normalizedName))
    .limit(1);

  if (existing) {
    throw new ApiError(409, "Meal item already exists");
  }

  const id = randomUUID();
  await db.insert(mealItems).values({
    id,
    name: normalizedName,
    isActive: 1,
    createdBy: manager.id,
    updatedBy: manager.id,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id,
        name: normalizedName,
        isActive: 1,
      },
      "Meal item created successfully"
    )
  );
};

// PATCH /api/v1/dining/meal-items/:itemId - Update meal item
export const updateMealItem = async (req: Request, res: Response) => {
  const manager = requireAdminAccount(req);
  const { itemId } = req.params as { itemId: string };
  const { name, isActive } = req.body;

  const [existing] = await db
    .select({ id: mealItems.id })
    .from(mealItems)
    .where(eq(mealItems.id, itemId))
    .limit(1);

  if (!existing) {
    throw new ApiError(404, "Meal item not found");
  }

  const updateData: { name?: string; isActive?: number; updatedBy: string } = {
    updatedBy: manager.id,
  };

  if (name !== undefined) {
    const normalizedName = String(name).trim();
    const [duplicate] = await db
      .select({ id: mealItems.id })
      .from(mealItems)
      .where(
        and(eq(mealItems.name, normalizedName), not(eq(mealItems.id, itemId)))
      )
      .limit(1);

    if (duplicate) {
      throw new ApiError(409, "Another meal item already uses this name");
    }

    updateData.name = normalizedName;
  }

  if (isActive !== undefined) {
    updateData.isActive = isActive ? 1 : 0;
  }

  await db.update(mealItems).set(updateData).where(eq(mealItems.id, itemId));

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { id: itemId, ...updateData },
        "Meal item updated successfully"
      )
    );
};

// DELETE /api/v1/dining/meal-items/:itemId - Delete unused meal item
export const deleteMealItem = async (req: Request, res: Response) => {
  const { itemId } = req.params as { itemId: string };

  const [existing] = await db
    .select({ id: mealItems.id })
    .from(mealItems)
    .where(eq(mealItems.id, itemId))
    .limit(1);

  if (!existing) {
    throw new ApiError(404, "Meal item not found");
  }

  const [mapped] = await db
    .select({ id: mealMenuItems.id })
    .from(mealMenuItems)
    .where(eq(mealMenuItems.mealItemId, itemId))
    .limit(1);

  if (mapped) {
    throw new ApiError(400, "Cannot delete a meal item already used in menus");
  }

  await db.delete(mealItems).where(eq(mealItems.id, itemId));

  res
    .status(200)
    .json(
      new ApiResponse(200, { id: itemId }, "Meal item deleted successfully")
    );
};

/**
 * GET /api/v1/dining/bookings/menu/:menuId
 * Get all bookings for a specific menu
 */
export const getAllBookingsForMenu = async (req: Request, res: Response) => {
  const { menuId } = req.params as { menuId: string };
  const { status, page = 1, limit = 20 } = req.query;
  const manager = requireAdminAccount(req);

  const [menu] = await db
    .select()
    .from(mealMenus)
    .where(eq(mealMenus.id, menuId))
    .limit(1);

  if (!menu) {
    throw new ApiError(404, "Menu not found");
  }

  if (menu.hall !== manager.hall) {
    throw new ApiError(403, "Menu does not belong to your hall");
  }

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const offset = (pageNum - 1) * limitNum;

  let conditions = [eq(mealTokens.menuId, menuId)];

  if (status === "ACTIVE") {
    conditions.push(isNull(mealTokens.cancelledAt));
  } else if (status === "CANCELLED") {
    conditions.push(not(isNull(mealTokens.cancelledAt)));
  }

  const bookings = await db
    .select({
      tokenId: mealTokens.id,
      studentId: uniStudents.id,
      studentName: uniStudents.name,
      rollNumber: uniStudents.rollNumber,
      quantity: mealTokens.quantity,
      totalAmount: mealTokens.totalAmount,
      bookingTime: mealTokens.bookingTime,
      cancelledAt: mealTokens.cancelledAt,
      paymentMethod: mealPayments.paymentMethod,
      bankReceiptUrl: mealPayments.bankReceiptUrl,
      receiptVerifiedAt: mealPayments.receiptVerifiedAt,
    })
    .from(mealTokens)
    .innerJoin(uniStudents, eq(mealTokens.studentId, uniStudents.id))
    .innerJoin(mealPayments, eq(mealTokens.paymentId, mealPayments.id))
    .where(and(...conditions))
    .orderBy(desc(mealTokens.bookingTime))
    .limit(limitNum)
    .offset(offset);

  const [countResult] = await db
    .select({ count: count() })
    .from(mealTokens)
    .where(and(...conditions));

  const total = countResult?.count || 0;
  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        bookings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      },
      "Menu bookings retrieved successfully"
    )
  );
};

// GET /api/v1/dining/bookings/tomorrow - Get all bookings for tomorrow
export const getTomorrowBookings = async (req: Request, res: Response) => {
  const manager = requireAdminAccount(req);

  const tomorrowDate = toDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const bookings = await db
    .select({
      mealType: mealTokens.mealType,
      totalTokens: sum(mealTokens.quantity),
      totalRevenue: sum(mealTokens.totalAmount),
    })
    .from(mealTokens)
    .where(
      and(
        eq(mealTokens.hall, manager.hall),
        isNull(mealTokens.cancelledAt),
        sql`${mealTokens.mealDate} = CAST(${tomorrowDate} AS DATE)`
      )
    )
    .groupBy(mealTokens.mealType);

  const response = {
    lunch: bookings.find((b) => b.mealType === "LUNCH") || {
      mealType: "LUNCH",
      totalTokens: 0,
      totalRevenue: 0,
    },
    dinner: bookings.find((b) => b.mealType === "DINNER") || {
      mealType: "DINNER",
      totalTokens: 0,
      totalRevenue: 0,
    },
  };

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        response,
        "Tomorrow's bookings retrieved successfully"
      )
    );
};

/**
 * PATCH /api/v1/dining/tokens/mark-consumed
 * Mark tokens as consumed after meal service
 */
export const markTokensAsConsumed = async (req: Request, res: Response) => {
  const manager = requireAdminAccount(req);
  const { tokenIds } = req.body;

  // Keep manager referenced so the role-specific account is validated.
  void manager;
  void tokenIds;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        message:
          "Note: Consumed tracking requires schema update with consumedAt and verifiedBy fields",
      },
      "Tokens marked as consumed feature pending schema update"
    )
  );
};

// GET /api/v1/dining/report/daily - Generate daily consumption report
export const getDailyReport = async (req: Request, res: Response) => {
  const manager = requireAdminAccount(req);
  const { date } = req.query;

  const reportDate = date
    ? toDateString(new Date(date as string))
    : toDateString(new Date());

  const bookings = await db
    .select({
      mealType: mealTokens.mealType,
      totalBooked: count(),
      totalTokens: sum(mealTokens.quantity),
      totalRevenue: sum(mealTokens.totalAmount),
      cancelled: sum(isNotNull(mealTokens.cancelledAt)),
    })
    .from(mealTokens)
    .where(
      and(
        eq(mealTokens.hall, manager.hall),
        sql`${mealTokens.mealDate} = CAST(${reportDate} AS DATE)`
      )
    )
    .groupBy(mealTokens.mealType);

  const lunch = bookings.find((b) => b.mealType === "LUNCH") || {
    totalBooked: 0,
    totalTokens: 0,
    totalRevenue: 0,
    cancelled: 0,
  };

  const dinner = bookings.find((b) => b.mealType === "DINNER") || {
    totalBooked: 0,
    totalTokens: 0,
    totalRevenue: 0,
    cancelled: 0,
  };

  const report = {
    date: reportDate,
    totalTokensSold: Number(lunch.totalTokens) + Number(dinner.totalTokens),
    totalRevenue: Number(lunch.totalRevenue) + Number(dinner.totalRevenue),
    totalCancellations: Number(lunch.cancelled) + Number(dinner.cancelled),
    lunch: {
      booked: Number(lunch.totalTokens),
      revenue: Number(lunch.totalRevenue),
      cancelled: Number(lunch.cancelled),
    },
    dinner: {
      booked: Number(dinner.totalTokens),
      revenue: Number(dinner.totalRevenue),
      cancelled: Number(dinner.cancelled),
    },
  };

  res
    .status(200)
    .json(new ApiResponse(200, report, "Daily report generated successfully"));
};

// GET /api/v1/dining/report/range - Generate date-range sales history report
export const getDateRangeSalesReport = async (req: Request, res: Response) => {
  const manager = requireAdminAccount(req);
  const { startDate, endDate } = req.query as {
    startDate: string;
    endDate: string;
  };

  const normalizedStartDate = toDateString(new Date(startDate));
  const normalizedEndDate = toDateString(new Date(endDate));

  if (normalizedStartDate > normalizedEndDate) {
    throw new ApiError(400, "Start date cannot be after end date");
  }

  const rangeInDays =
    Math.floor(
      (new Date(normalizedEndDate).getTime() -
        new Date(normalizedStartDate).getTime()) /
        (24 * 60 * 60 * 1000)
    ) + 1;

  if (rangeInDays > 366) {
    throw new ApiError(400, "Date range cannot exceed 366 days");
  }

  const bookings = await db
    .select({
      mealDate: mealTokens.mealDate,
      mealType: mealTokens.mealType,
      soldTokens: sql<number>`SUM(CASE WHEN ${mealTokens.cancelledAt} IS NULL THEN ${mealTokens.quantity} ELSE 0 END)`,
      soldRevenue: sql<number>`SUM(CASE WHEN ${mealTokens.cancelledAt} IS NULL THEN ${mealTokens.totalAmount} ELSE 0 END)`,
      cancelledTokens: sql<number>`SUM(CASE WHEN ${mealTokens.cancelledAt} IS NOT NULL THEN ${mealTokens.quantity} ELSE 0 END)`,
    })
    .from(mealTokens)
    .where(
      and(
        eq(mealTokens.hall, manager.hall),
        sql`${mealTokens.mealDate} >= CAST(${normalizedStartDate} AS DATE)`,
        sql`${mealTokens.mealDate} <= CAST(${normalizedEndDate} AS DATE)`
      )
    )
    .groupBy(mealTokens.mealDate, mealTokens.mealType)
    .orderBy(mealTokens.mealDate);

  const reportByDate = new Map<
    string,
    {
      date: string;
      lunchTokens: number;
      lunchRevenue: number;
      dinnerTokens: number;
      dinnerRevenue: number;
      totalTokensSold: number;
      totalRevenue: number;
      totalCancellations: number;
    }
  >();

  bookings.forEach((row) => {
    const dateKey = toDateString(new Date(row.mealDate));
    const existing = reportByDate.get(dateKey) || {
      date: dateKey,
      lunchTokens: 0,
      lunchRevenue: 0,
      dinnerTokens: 0,
      dinnerRevenue: 0,
      totalTokensSold: 0,
      totalRevenue: 0,
      totalCancellations: 0,
    };

    const soldTokens = Number(row.soldTokens || 0);
    const soldRevenue = Number(row.soldRevenue || 0);
    const cancelledTokens = Number(row.cancelledTokens || 0);

    if (row.mealType === "LUNCH") {
      existing.lunchTokens += soldTokens;
      existing.lunchRevenue += soldRevenue;
    }

    if (row.mealType === "DINNER") {
      existing.dinnerTokens += soldTokens;
      existing.dinnerRevenue += soldRevenue;
    }

    existing.totalTokensSold += soldTokens;
    existing.totalRevenue += soldRevenue;
    existing.totalCancellations += cancelledTokens;

    reportByDate.set(dateKey, existing);
  });

  const days: Array<{
    date: string;
    lunchTokens: number;
    lunchRevenue: number;
    dinnerTokens: number;
    dinnerRevenue: number;
    totalTokensSold: number;
    totalRevenue: number;
    totalCancellations: number;
  }> = [];

  const cursor = new Date(normalizedStartDate);
  const end = new Date(normalizedEndDate);

  while (cursor <= end) {
    const dateKey = toDateString(cursor);
    days.push(
      reportByDate.get(dateKey) || {
        date: dateKey,
        lunchTokens: 0,
        lunchRevenue: 0,
        dinnerTokens: 0,
        dinnerRevenue: 0,
        totalTokensSold: 0,
        totalRevenue: 0,
        totalCancellations: 0,
      }
    );
    cursor.setDate(cursor.getDate() + 1);
  }

  const summary = days.reduce(
    (acc, day) => {
      acc.totalTokensSold += day.totalTokensSold;
      acc.totalRevenue += day.totalRevenue;
      acc.totalCancellations += day.totalCancellations;
      acc.lunchTokensSold += day.lunchTokens;
      acc.dinnerTokensSold += day.dinnerTokens;
      return acc;
    },
    {
      totalTokensSold: 0,
      totalRevenue: 0,
      totalCancellations: 0,
      lunchTokensSold: 0,
      dinnerTokensSold: 0,
    }
  );

  res.status(200).json(
    new ApiResponse(
      200,
      {
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        days,
        summary,
      },
      "Date-range sales report generated successfully"
    )
  );
};

// GET /api/v1/dining/report/monthly - Generate monthly summary
export const getMonthlyReport = async (req: Request, res: Response) => {
  const manager = requireAdminAccount(req);
  const { month, year } = req.query;

  const monthNum = Number(month);
  const yearNum = Number(year);

  const startDate = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
  const endDate = new Date(yearNum, monthNum, 0);
  const endDateStr = toDateString(endDate);

  const bookings = await db
    .select({
      totalTokens: sum(mealTokens.quantity),
      totalRevenue: sum(mealTokens.totalAmount),
      totalBookings: count(),
      totalCancelled: sum(isNotNull(mealTokens.cancelledAt)),
    })
    .from(mealTokens)
    .where(
      and(
        eq(mealTokens.hall, manager.hall),
        sql`${mealTokens.mealDate} >= CAST(${startDate} AS DATE)`,
        sql`${mealTokens.mealDate} <= CAST(${endDateStr} AS DATE)`
      )
    );

  const result = bookings[0] || {
    totalTokens: 0,
    totalRevenue: 0,
    totalBookings: 0,
    totalCancelled: 0,
  };

  const daysInMonth = endDate.getDate();
  const averageTokensPerDay = Number(result.totalTokens) / daysInMonth;
  const cancellationRate =
    Number(result.totalBookings) > 0
      ? (Number(result.totalCancelled) / Number(result.totalBookings)) * 100
      : 0;

  const report = {
    month: monthNum,
    year: yearNum,
    totalRevenue: Number(result.totalRevenue),
    totalTokensSold: Number(result.totalTokens),
    averageTokensPerDay: Math.round(averageTokensPerDay),
    cancellationRate: Math.round(cancellationRate * 100) / 100,
    daysInMonth,
  };

  res
    .status(200)
    .json(
      new ApiResponse(200, report, "Monthly report generated successfully")
    );
};

// PAYMENT CONTROLLERS - SHARED BY STUDENT & MANAGER

// POST /api/v1/dining/payment/process - Process payment
export const processPayment = async (req: Request, res: Response) => {
  const student = requireStudentAccount(req);
  const { amount, paymentMethod, transactionId, totalQuantity } = req.body;

  const [existingTransaction] = await db
    .select()
    .from(mealPayments)
    .where(eq(mealPayments.transactionId, transactionId))
    .limit(1);

  if (existingTransaction) {
    throw new ApiError(409, "Transaction ID already exists");
  }

  const paymentId = randomUUID();

  await db.insert(mealPayments).values({
    id: paymentId,
    studentId: student.id,
    amount,
    totalQuantity,
    paymentMethod,
    transactionId,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        paymentId,
        amount,
        paymentMethod,
        transactionId,
        status: "COMPLETED",
      },
      "Payment processed successfully"
    )
  );
};

// GET /api/v1/dining/payment/:paymentId - Get payment details
export const getPaymentDetails = async (req: Request, res: Response) => {
  const { paymentId } = req.params as { paymentId: string };
  const userRole = req.user?.role;

  const [payment] = await db
    .select({
      paymentId: mealPayments.id,
      amount: mealPayments.amount,
      totalQuantity: mealPayments.totalQuantity,
      paymentMethod: mealPayments.paymentMethod,
      transactionId: mealPayments.transactionId,
      paymentDate: mealPayments.paymentDate,
      refundedAt: mealPayments.refundedAt,
      refundAmount: mealPayments.refundAmount,
      studentId: uniStudents.id,
      studentName: uniStudents.name,
      studentEmail: uniStudents.email,
    })
    .from(mealPayments)
    .innerJoin(uniStudents, eq(mealPayments.studentId, uniStudents.id))
    .where(eq(mealPayments.id, paymentId))
    .limit(1);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  if (userRole === "STUDENT") {
    const student = requireStudentAccount(req);

    if (payment.studentId !== student.id) {
      throw new ApiError(403, "This payment does not belong to you");
    }
  } else if (userRole === "DINING_MANAGER") {
    const manager = requireAdminAccount(req);

    // For dining managers, we need to check if the user who made the payment
    // is associated with their hall (if they are a hall student)
    const [studentHall] = await db
      .select({ hall: uniStudents.hall })
      .from(uniStudents)
      .where(eq(uniStudents.id, payment.studentId))
      .limit(1);

    // If user is not a hall student, or belongs to different hall, deny access
    if (!studentHall || studentHall.hall !== manager.hall) {
      throw new ApiError(
        403,
        "This payment does not belong to your hall's student"
      );
    }
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, payment, "Payment details retrieved successfully")
    );
};

// POST /api/v1/dining/payment/:paymentId/refund - Process refund
export const processRefund = async (req: Request, res: Response) => {
  const { paymentId } = req.params as { paymentId: string };
  const { refundAmount, refundReason } = req.body;
  const userRole = req.user?.role;

  const [payment] = await db
    .select()
    .from(mealPayments)
    .where(eq(mealPayments.id, paymentId))
    .limit(1);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  if (userRole === "STUDENT") {
    const student = requireStudentAccount(req);

    if (payment.studentId !== student.id) {
      throw new ApiError(403, "This payment does not belong to you");
    }
  }

  if (payment.refundedAt) {
    throw new ApiError(400, "Refund has already been processed");
  }

  const currentRefundTotal = (payment.refundAmount || 0) + refundAmount;
  if (currentRefundTotal > payment.amount) {
    throw new ApiError(
      400,
      `Refund amount exceeds payment amount. Maximum refundable: ${payment.amount - (payment.refundAmount || 0)}`
    );
  }

  const now = new Date();

  await db
    .update(mealPayments)
    .set({
      refundAmount: currentRefundTotal,
      refundedAt: now,
    })
    .where(eq(mealPayments.id, paymentId));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        paymentId,
        refundAmount,
        refundReason,
        refundedAt: now,
        totalRefunded: currentRefundTotal,
      },
      "Refund processed successfully"
    )
  );
};
