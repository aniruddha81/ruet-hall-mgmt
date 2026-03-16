import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { studentDues } from "../../db/models/index.ts";
import type { Hall } from "../../types/enums.ts";

const getSeatChargeStartDate = (application: {
  createdAt: Date;
  reviewedAt: Date | null;
}) => application.reviewedAt ?? application.createdAt;

export const getSeatChargeForApplication = async (application: {
  studentId: string;
  hall: Hall | null;
  createdAt: Date;
  reviewedAt: Date | null;
}) => {
  if (!application.hall) {
    return null;
  }

  const [seatCharge] = await db
    .select({
      id: studentDues.id,
      studentId: studentDues.studentId,
      hall: studentDues.hall,
      type: studentDues.type,
      amount: studentDues.amount,
      status: studentDues.status,
      paidAt: studentDues.paidAt,
      createdAt: studentDues.createdAt,
    })
    .from(studentDues)
    .where(
      and(
        eq(studentDues.studentId, application.studentId),
        eq(studentDues.hall, application.hall),
        eq(studentDues.type, "RENT"),
        gte(studentDues.createdAt, getSeatChargeStartDate(application))
      )
    )
    .orderBy(desc(studentDues.createdAt))
    .limit(1);

  return seatCharge ?? null;
};
