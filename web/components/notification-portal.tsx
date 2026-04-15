"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getApiErrorMessage } from "@/lib/api";
import {
  getMyNotifications,
  markNotificationAsRead,
} from "@/lib/services/notification.service";
import type { NotificationItem } from "@/lib/types";
import { Bell, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function NotificationPortal() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasUnread = unreadCount > 0;

  const latestNotifications = useMemo(
    () => notifications.slice(0, 8),
    [notifications],
  );

  const loadNotifications = async () => {
    try {
      const res = await getMyNotifications(20);
      setNotifications(res.data.notifications ?? []);
      setUnreadCount(res.data.unreadCount ?? 0);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();

    const interval = setInterval(() => {
      void loadNotifications();
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const handleOpenNotification = async (notification: NotificationItem) => {
    setSelectedNotification(notification);

    if (notification.isRead) {
      return;
    }

    try {
      await markNotificationAsRead(notification.id);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-lg">
            <Bell className="h-5 w-5" />
            {hasUnread ? (
              <span className="absolute right-1.5 top-1.5 flex h-3 w-3 items-center justify-center">
                <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-destructive/70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
              </span>
            ) : null}
            <span className="sr-only">Notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-85">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {hasUnread ? (
              <span className="text-xs text-destructive">
                {unreadCount} new
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">All read</span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : latestNotifications.length === 0 ? (
            <p className="px-3 py-6 text-sm text-center text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            latestNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onSelect={(event) => {
                  event.preventDefault();
                  void handleOpenNotification(notification);
                }}
                className="flex flex-col items-start gap-1 py-2"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="line-clamp-1 font-medium text-foreground">
                    {notification.title}
                  </span>
                  {!notification.isRead ? (
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-destructive" />
                  ) : null}
                </div>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {notification.message}
                </span>
                <span className="text-[11px] text-muted-foreground/80">
                  {new Date(notification.createdAt).toLocaleString("en-GB")}
                </span>
              </DropdownMenuItem>
            ))
          )}
          {error ? (
            <p className="px-3 pb-2 pt-1 text-xs text-destructive">{error}</p>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedNotification ? (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-background shadow-xl">
            <div className="flex items-start justify-between border-b p-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedNotification.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(selectedNotification.createdAt).toLocaleString(
                    "en-GB",
                  )}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedNotification(null)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {selectedNotification.message}
              </p>
            </div>
            <div className="flex justify-end border-t p-4">
              <Button onClick={() => setSelectedNotification(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
