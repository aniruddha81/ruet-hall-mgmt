import { and, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  notificationReads,
  rooms,
  uniStudents,
} from "../db/models/index.ts";
import { invalidateAuthAccountCache } from "./cache.ts";
import {
  deleteStudentVerifyOtp,
  otpKeys,
} from "./otpStore.ts";
import { getRedis } from "./redis.ts";
import { revokeAllUserSessions } from "./sessionStore.ts";

async function clearStudentOtpRedisKeys(userId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) {
    return;
  }
  await redis.del(otpKeys.studentEmailVerify(userId));
  await redis.del(otpKeys.studentResendCooldown(userId));
}

/**
 * Permanently delete a student account and all related rows.
 * Cascading FKs remove admission, dining, finance, and inventory records.
 */
export async function purgeStudentAccount(studentId: string): Promise<void> {
  const [student] = await db
    .select({
      id: uniStudents.id,
      roomId: uniStudents.roomId,
      isAllocated: uniStudents.isAllocated,
    })
    .from(uniStudents)
    .where(eq(uniStudents.id, studentId))
    .limit(1);

  if (!student) {
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(notificationReads)
      .where(
        and(
          eq(notificationReads.readerId, studentId),
          eq(notificationReads.readerRole, "STUDENT")
        )
      );

    if (student.isAllocated && student.roomId) {
      const [room] = await tx
        .select()
        .from(rooms)
        .where(eq(rooms.id, student.roomId))
        .limit(1);

      if (room) {
        const nextOccupancy = Math.max(0, room.currentOccupancy - 1);
        const nextStatus =
          room.status === "OCCUPIED" && nextOccupancy < room.capacity
            ? "AVAILABLE"
            : room.status;

        await tx
          .update(rooms)
          .set({
            currentOccupancy: nextOccupancy,
            status: nextStatus,
          })
          .where(eq(rooms.id, student.roomId));
      }
    }

    await tx.delete(uniStudents).where(eq(uniStudents.id, studentId));
  });

  await revokeAllUserSessions(studentId);
  await deleteStudentVerifyOtp(studentId);
  await clearStudentOtpRedisKeys(studentId);
  await invalidateAuthAccountCache(studentId, "STUDENT");
}
