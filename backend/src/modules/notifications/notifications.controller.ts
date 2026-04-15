import { randomUUID } from "crypto";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../../db/index.ts";
import {
  hallAdmins,
  notificationReads,
  notifications,
} from "../../db/models/index.ts";
import ApiError from "../../utils/ApiError.ts";
import ApiResponse from "../../utils/ApiResponse.ts";
import {
  requireAdminAccount,
  requireAuthenticatedAccount,
} from "./notifications.service.ts";

export const createNotification = async (req: Request, res: Response) => {
  const admin = requireAdminAccount(req);
  const { title, message, targetAudience } = req.body as {
    title: string;
    message: string;
    targetAudience: "STUDENT" | "ADMIN";
  };

  const notificationId = randomUUID();

  await db.insert(notifications).values({
    id: notificationId,
    title,
    message,
    targetAudience,
    createdByAdminId: admin.id,
  });

  const [createdNotification] = await db
    .select({
      id: notifications.id,
      title: notifications.title,
      message: notifications.message,
      targetAudience: notifications.targetAudience,
      createdByAdminId: notifications.createdByAdminId,
      createdByName: hallAdmins.name,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .leftJoin(hallAdmins, eq(notifications.createdByAdminId, hallAdmins.id))
    .where(eq(notifications.id, notificationId))
    .limit(1);

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { notification: createdNotification },
        "Notification created successfully"
      )
    );
};

export const getMyNotifications = async (req: Request, res: Response) => {
  const authAccount = requireAuthenticatedAccount(req);
  const { limit = 20 } = req.query as { limit?: number };

  const viewerRole = authAccount.kind === "STUDENT" ? "STUDENT" : "ADMIN";
  const readerId =
    authAccount.kind === "STUDENT"
      ? authAccount.student.id
      : authAccount.admin.id;

  const notificationRows = await db
    .select({
      id: notifications.id,
      title: notifications.title,
      message: notifications.message,
      targetAudience: notifications.targetAudience,
      createdByAdminId: notifications.createdByAdminId,
      createdByName: hallAdmins.name,
      createdAt: notifications.createdAt,
      readAt: notificationReads.readAt,
    })
    .from(notifications)
    .leftJoin(
      notificationReads,
      and(
        eq(notificationReads.notificationId, notifications.id),
        eq(notificationReads.readerId, readerId),
        eq(notificationReads.readerRole, viewerRole)
      )
    )
    .leftJoin(hallAdmins, eq(notifications.createdByAdminId, hallAdmins.id))
    .where(eq(notifications.targetAudience, viewerRole))
    .orderBy(desc(notifications.createdAt))
    .limit(Number(limit));

  const [unreadCountResult] = await db
    .select({
      unreadCount: count(),
    })
    .from(notifications)
    .leftJoin(
      notificationReads,
      and(
        eq(notificationReads.notificationId, notifications.id),
        eq(notificationReads.readerId, readerId),
        eq(notificationReads.readerRole, viewerRole)
      )
    )
    .where(
      and(
        eq(notifications.targetAudience, viewerRole),
        isNull(notificationReads.id)
      )
    );

  const formattedNotifications = notificationRows.map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    targetAudience: row.targetAudience,
    createdByAdminId: row.createdByAdminId,
    createdByName: row.createdByName ?? "Hall Admin",
    createdAt: row.createdAt,
    readAt: row.readAt,
    isRead: Boolean(row.readAt),
  }));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications: formattedNotifications,
        unreadCount: Number(unreadCountResult?.unreadCount || 0),
      },
      "Notifications retrieved successfully"
    )
  );
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  const authAccount = requireAuthenticatedAccount(req);
  const { notificationId } = req.params as { notificationId: string };

  const viewerRole = authAccount.kind === "STUDENT" ? "STUDENT" : "ADMIN";
  const readerId =
    authAccount.kind === "STUDENT"
      ? authAccount.student.id
      : authAccount.admin.id;

  const [notification] = await db
    .select({
      id: notifications.id,
      targetAudience: notifications.targetAudience,
    })
    .from(notifications)
    .where(eq(notifications.id, notificationId))
    .limit(1);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (notification.targetAudience !== viewerRole) {
    throw new ApiError(
      403,
      "This notification is not intended for your account type"
    );
  }

  const [existingRead] = await db
    .select({
      id: notificationReads.id,
      readAt: notificationReads.readAt,
    })
    .from(notificationReads)
    .where(
      and(
        eq(notificationReads.notificationId, notificationId),
        eq(notificationReads.readerId, readerId),
        eq(notificationReads.readerRole, viewerRole)
      )
    )
    .limit(1);

  if (!existingRead) {
    await db.insert(notificationReads).values({
      id: randomUUID(),
      notificationId,
      readerId,
      readerRole: viewerRole,
    });
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        notificationId,
        isRead: true,
      },
      "Notification marked as read"
    )
  );
};
