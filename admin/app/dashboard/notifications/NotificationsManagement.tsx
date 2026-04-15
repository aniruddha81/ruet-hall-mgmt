"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api";
import {
  createNotification,
  getMyNotifications,
} from "@/lib/services/notification.service";
import {
  NOTIFICATION_AUDIENCES,
  type NotificationAudience,
  type NotificationItem,
} from "@/lib/types";
import { BellRing, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function NotificationsManagement() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] =
    useState<NotificationAudience>("STUDENT");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await getMyNotifications(25);
      setNotifications(res.data.notifications ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();
  }, []);

  const handleCreateNotification = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setCreating(true);

    try {
      const res = await createNotification({
        title,
        message,
        targetAudience,
      });

      setTitle("");
      setMessage("");
      setSuccess(
        `Notification sent to ${res.data.notification.targetAudience.toLowerCase()}s successfully.`,
      );

      await fetchNotifications();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <BellRing className="h-8 w-8" />
          Notifications Portal
        </h2>
        <p className="text-muted-foreground mt-1">
          Create targeted notifications for students or admins.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
          {success}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Create New Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreateNotification}
            className="space-y-4 max-w-2xl"
          >
            <div className="space-y-2">
              <Label htmlFor="notificationTitle">Title</Label>
              <Input
                id="notificationTitle"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Dining token booking window changed"
                minLength={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notificationMessage">Message</Label>
              <textarea
                id="notificationMessage"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write full notification details..."
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                minLength={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <select
                id="targetAudience"
                value={targetAudience}
                onChange={(event) =>
                  setTargetAudience(event.target.value as NotificationAudience)
                }
                className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {NOTIFICATION_AUDIENCES.map((audience) => (
                  <option key={audience} value={audience}>
                    {audience}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" disabled={creating}>
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Send Notification
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest Admin Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No notifications available yet.
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-lg border border-border/60 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground">
                      {notification.title}
                    </h3>
                    <Badge
                      variant={
                        notification.isRead ? "secondary" : "destructive"
                      }
                    >
                      {notification.isRead ? "Read" : "Unread"}
                    </Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/80">
                    {new Date(notification.createdAt).toLocaleString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
