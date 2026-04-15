import api from "@/lib/api";
import type {
  ApiResponse,
  NotificationAudience,
  NotificationItem,
  NotificationListData,
} from "@/lib/types";

export async function getMyNotifications(limit = 20) {
  const res = await api.get<ApiResponse<NotificationListData>>(
    "/notifications/my",
    {
      params: { limit },
    },
  );
  return res.data;
}

export async function markNotificationAsRead(notificationId: string) {
  const res = await api.patch<
    ApiResponse<{ notificationId: string; isRead: boolean }>
  >(`/notifications/${notificationId}/read`);
  return res.data;
}

export async function createNotification(data: {
  title: string;
  message: string;
  targetAudience: NotificationAudience;
}) {
  const res = await api.post<ApiResponse<{ notification: NotificationItem }>>(
    "/notifications",
    data,
  );
  return res.data;
}
