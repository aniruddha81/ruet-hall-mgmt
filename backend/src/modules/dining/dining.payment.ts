import { randomUUID } from "crypto";
import { and, eq, isNull, sql, sum } from "drizzle-orm";
import { db } from "../../db/index.ts";
import {
  mealMenus,
  mealPayments,
  mealTokens,
} from "../../db/models/dining.models.ts";
import type { PaymentMethod } from "../../types/enums.ts";
import ApiError from "../../utils/ApiError.ts";
import { toDateString } from "../../utils/helpers.ts";
import {
  getStudentInfo,
  sendReceiptEmail,
} from "../finance/finance.service.ts";

export type MealBookingPayload = {
  menuId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  bankReceiptUrl?: string | null;
};

export type MealBookingResult = {
  tokenId: string;
  paymentId: string;
  quantity: number;
  totalAmount: number;
  mealType: string;
  mealDate: string;
  transactionId: string;
  paymentMethod: PaymentMethod;
  bankReceiptUrl: string | null;
};

export async function completeMealBooking(
  studentId: string,
  payload: MealBookingPayload,
  transactionId: string
): Promise<MealBookingResult> {
  const { menuId, quantity, paymentMethod, bankReceiptUrl = null } = payload;

  if (quantity <= 0 || quantity > 20) {
    throw new ApiError(
      400,
      "You can only book between 1 and 20 tokens at a time."
    );
  }

  const tomorrowDate = toDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const tokenId = randomUUID();
  const paymentId = randomUUID();

  const reservation = await db.transaction(async (trx) => {
    const [existingTokensResult] = await trx
      .select({ total: sum(mealTokens.quantity) })
      .from(mealTokens)
      .where(
        and(
          eq(mealTokens.studentId, studentId),
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

    const reserved = await trx
      .update(mealMenus)
      .set({ bookedTokens: sql`${mealMenus.bookedTokens} + ${quantity}` })
      .where(
        and(
          eq(mealMenus.id, menuId),
          sql`(${mealMenus.totalTokens} - ${mealMenus.bookedTokens}) >= ${quantity}`
        )
      )
      .returning({ id: mealMenus.id });

    if (reserved.length === 0) {
      throw new ApiError(
        400,
        `Not enough tokens available. Cannot book ${quantity} tokens.`
      );
    }

    await trx.insert(mealPayments).values({
      id: paymentId,
      studentId,
      amount: totalAmount,
      totalQuantity: quantity,
      paymentMethod,
      transactionId,
      bankReceiptUrl,
    });

    await trx.insert(mealTokens).values({
      id: tokenId,
      studentId,
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

  getStudentInfo(studentId).then((studentInfo) => {
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

  return {
    tokenId,
    paymentId,
    quantity,
    totalAmount: reservation.totalAmount,
    mealType: reservation.mealType,
    mealDate: reservation.mealDate,
    transactionId,
    paymentMethod,
    bankReceiptUrl,
  };
}
