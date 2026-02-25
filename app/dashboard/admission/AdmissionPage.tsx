"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import {
  applyForSeat,
  getMyApplicationStatus,
} from "@/lib/services/admission.service";
import type { SeatApplication } from "@/lib/types";
import { ClipboardList, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdmissionPage() {
  const { user } = useAuth();
  const [application, setApplication] = useState<SeatApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await getMyApplicationStatus();
        setApplication(res.data?.application ?? null);
      } catch {
        // No application yet
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleApply = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !user.hall) {
      setError(
        "Your profile is missing hall information. Please update your profile first.",
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await applyForSeat({
        hall: user.hall,
        academicDepartment: user.academicDepartment,
        session: user.session,
      });
      setSuccess("Application submitted successfully!");
      const res = await getMyApplicationStatus();
      setApplication(res.data?.application ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <ClipboardList className="h-8 w-8" />
          Seat Application
        </h2>
        <p className="text-muted-foreground mt-1">
          Apply for a hall seat or check your application status
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg dark:text-green-400 dark:bg-green-950 dark:border-green-900">
          {success}
        </div>
      )}

      {application ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    application.status === "APPROVED"
                      ? "default"
                      : application.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                  }
                  className="mt-1"
                >
                  {application.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Applied On</p>
                <p className="font-medium mt-1">
                  {application.createdAt
                    ? new Date(application.createdAt).toLocaleDateString(
                        "en-GB",
                      )
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hall</p>
                <p className="font-medium mt-1">
                  {application.hall?.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium mt-1">
                  {application.academicDepartment}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Session</p>
                <p className="font-medium mt-1">{application.session}</p>
              </div>
              {application.reviewedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Reviewed On</p>
                  <p className="font-medium mt-1">
                    {new Date(application.reviewedAt).toLocaleDateString(
                      "en-GB",
                    )}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Apply for Hall Seat</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApply} className="space-y-4 max-w-lg">
              <p className="text-sm text-muted-foreground">
                Your application will be submitted with your profile details:
              </p>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Hall</p>
                  <p className="font-medium">
                    {user?.hall?.replace(/_/g, " ") ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-medium">
                    {user?.academicDepartment ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Session</p>
                  <p className="font-medium">{user?.session ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{user?.rollNumber ?? "-"}</p>
                </div>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Submit Application
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
