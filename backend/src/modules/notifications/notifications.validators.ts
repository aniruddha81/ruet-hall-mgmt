import { z } from "zod";
import { NOTIFICATION_AUDIENCES } from "../../types/enums.ts";

export const createNotificationSchema = {
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(255, "Title cannot exceed 255 characters"),
    message: z
      .string()
      .trim()
      .min(5, "Message must be at least 5 characters")
      .max(5000, "Message cannot exceed 5000 characters"),
    targetAudience: z.enum(NOTIFICATION_AUDIENCES),
  }),
};

export const getMyNotificationsSchema = {
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((value) => (value ? parseInt(value, 10) : 20))
      .refine(
        (value) => Number.isInteger(value) && value >= 1 && value <= 100,
        "Limit must be an integer between 1 and 100"
      ),
  }),
};

export const markNotificationReadSchema = {
  params: z.object({
    notificationId: z.uuid("Invalid notification ID format"),
  }),
};
