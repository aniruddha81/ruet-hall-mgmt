import { randomUUID } from "crypto";
import {
  and,
  count,
  desc,
  eq,
  isNotNull,
  isNull,
  not,
  sql,
  sum,
} from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db";
import {
  mealMenus,
  mealPayments,
  mealTokens,
  uniStudents,
} from "../../db/models";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { toDateString } from "../../utils/helpers";
import { createMealPayment } from "../finance/finance.service";

const requireStudentAccount = (req: Request) => {
  if (req.authAccount?.kind !== "STUDENT") {
    throw new ApiError(401, "Student authentication required");
  }

  return req.authAccount.student;
};

const requireAdminAccount = (req: Request) => {
  if (req.authAccount?.kind !== "ADMIN") {
    throw new ApiError(401, "Admin authentication required");
  }

  return req.authAccount.admin;
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
    lunch: menus.filter((m) => m.mealType === "LUNCH") || null,
    dinner: menus.filter((m) => m.mealType === "DINNER") || null,
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
  const { menuId, quantity, paymentMethod, hall } = req.body;

  const [menu] = await db
    .select()
    .from(mealMenus)
    .where(and(eq(mealMenus.id, menuId), eq(mealMenus.hall, hall)))
    .limit(1);

  if (!menu) {
    throw new ApiError(404, "Menu not found");
  }

  const tomorrowDate = toDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const menuDateStr = toDateString(new Date(menu.mealDate));

  if (menuDateStr !== tomorrowDate) {
    throw new ApiError(400, "Can only book tokens for tomorrow's meals");
  }

  if (menu.availableTokens < quantity) {
    throw new ApiError(
      400,
      `Only ${menu.availableTokens} tokens available. Cannot book ${quantity} tokens.`
    );
  }

  const totalAmount = menu.price * quantity;

  // Process payment through finance service
  const payment = await createMealPayment({
    studentId: student.id,
    amount: totalAmount,
    totalQuantity: quantity,
    paymentMethod,
  });

  const tokenId = randomUUID();

  await db.transaction(async (trx) => {
    await trx.insert(mealTokens).values({
      id: tokenId,
      studentId: student.id,
      menuId: menu.id,
      hall: menu.hall,
      mealDate: menu.mealDate,
      mealType: menu.mealType,
      quantity,
      totalAmount,
      paymentId: payment.id,
    });

    await trx
      .update(mealMenus)
      .set({ bookedTokens: sql`${mealMenus.bookedTokens} + ${quantity}` })
      .where(eq(mealMenus.id, menuId));
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        tokenId,
        paymentId: payment.id,
        quantity,
        totalAmount,
        mealType: menu.mealType,
        mealDate: menuDateStr,
        transactionId: payment.transactionId,
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

  const now = new Date();
  const midnightToday = new Date(now);
  midnightToday.setHours(23, 59, 59, 999);

  if (now > midnightToday) {
    throw new ApiError(
      400,
      "Cannot cancel token after midnight on booking day"
    );
  }

  await db
    .update(mealTokens)
    .set({ cancelledAt: now })
    .where(eq(mealTokens.id, tokenId));

  await db
    .update(mealMenus)
    .set({ bookedTokens: sql`${mealMenus.bookedTokens} - ${token.quantity}` })
    .where(eq(mealMenus.id, token.menuId));

  const [payment] = await db
    .select()
    .from(mealPayments)
    .where(eq(mealPayments.id, token.paymentId))
    .limit(1);

  if (payment) {
    const newRefundAmount = (payment.refundAmount || 0) + token.totalAmount;
    await db
      .update(mealPayments)
      .set({
        refundAmount: newRefundAmount,
        refundedAt: now,
      })
      .where(eq(mealPayments.id, token.paymentId));
  }

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
  const { mealType, menuDescription, price, totalTokens } = req.body;
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

  await db.insert(mealMenus).values({
    id,
    hall: hall,
    mealType,
    menuDescription,
    price,
    totalTokens: totalTokens,
    createdBy: manager.id,
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
  const { menuDescription, price, totalTokens } = req.body;
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
  if (menuDescription !== undefined)
    updateData.menuDescription = menuDescription;
  if (price !== undefined) updateData.price = price;
  if (totalTokens !== undefined) updateData.totalTokens = totalTokens;

  await db.update(mealMenus).set(updateData).where(eq(mealMenus.id, menuId));

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
