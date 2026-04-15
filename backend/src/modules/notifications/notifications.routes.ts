import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.ts";
import { validateRequest } from "../../middlewares/validateRequest.middleware.ts";
import {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
} from "./notifications.controller.ts";
import {
  createNotificationSchema,
  getMyNotificationsSchema,
  markNotificationReadSchema,
} from "./notifications.validators.ts";

const notificationsRouter = Router();

notificationsRouter.post(
  "/",
  authenticateToken,
  validateRequest(createNotificationSchema),
  createNotification
);

notificationsRouter.get(
  "/my",
  authenticateToken,
  validateRequest(getMyNotificationsSchema),
  getMyNotifications
);

notificationsRouter.patch(
  "/:notificationId/read",
  authenticateToken,
  validateRequest(markNotificationReadSchema),
  markNotificationAsRead
);

export default notificationsRouter;
