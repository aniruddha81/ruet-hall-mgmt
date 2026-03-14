"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/api";
import {
  allocateSeat,
  getApplications,
  reviewApplication,
} from "@/lib/services/admission.service";
import type { SeatApplication, SeatApplicationStatus } from "@/lib/types";
import { ClipboardList, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdmissionsManagement() {
  const [applications, setApplications] = useState<SeatApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    SeatApplicationStatus | "ALL"
  >("ALL");
  const [allocating, setAllocating] = useState<string | null>(null);
  const [allocateForm, setAllocateForm] = useState({ roomId: "", bedId: "" });

  const fetchApplications = async () => {
    try {
      const params: { status?: SeatApplicationStatus } = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      const res = await getApplications(params);
      setApplications(res.data?.applications ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleReview = async (
    applicationId: string,
    status: SeatApplicationStatus,
  ) => {
    setError(null);
    setSuccess(null);
    try {
      await reviewApplication(applicationId, { status });
      setSuccess(`Application ${status.toLowerCase()}!`);
      await fetchApplications();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleAllocate = async (app: SeatApplication) => {
    if (!allocateForm.bedId || !allocateForm.roomId) {
      setError("Please enter both Room ID and Bed ID");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await allocateSeat({
        studentId: app.studentId,
        roomId: allocateForm.roomId,
        bedId: allocateForm.bedId,
      });
      setSuccess("Seat allocated successfully!");
      setAllocating(null);
      setAllocateForm({ roomId: "", bedId: "" });
      await fetchApplications();
    } catch (err) {
      setError(getApiErrorMessage(err));
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
          Admissions Management
        </h2>
        <p className="text-muted-foreground mt-1">
          Review seat applications, approve/reject, and allocate beds
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

      {/* Filter */}
      <div className="flex gap-2">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No applications found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-xs">
                      #{app.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {app.studentName ??
                        `Student #${app.studentId.slice(0, 8)}`}
                    </TableCell>
                    <TableCell>{app.rollNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {app.academicDepartment ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {app.session ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          app.status === "APPROVED"
                            ? "default"
                            : app.status === "REJECTED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {app.createdAt
                        ? new Date(app.createdAt).toLocaleDateString("en-GB")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {app.status === "PENDING" && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600"
                            onClick={() => handleReview(app.id, "APPROVED")}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleReview(app.id, "REJECTED")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {app.status === "APPROVED" && (
                        <>
                          {allocating === app.id ? (
                            <div className="flex gap-1 items-center">
                              <Input
                                placeholder="Room ID"
                                className="w-24 h-8"
                                value={allocateForm.roomId}
                                onChange={(e) =>
                                  setAllocateForm({
                                    ...allocateForm,
                                    roomId: e.target.value,
                                  })
                                }
                              />
                              <Input
                                placeholder="Bed ID"
                                className="w-24 h-8"
                                value={allocateForm.bedId}
                                onChange={(e) =>
                                  setAllocateForm({
                                    ...allocateForm,
                                    bedId: e.target.value,
                                  })
                                }
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAllocate(app)}
                              >
                                Go
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAllocating(app.id)}
                            >
                              Allocate Seat
                            </Button>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
