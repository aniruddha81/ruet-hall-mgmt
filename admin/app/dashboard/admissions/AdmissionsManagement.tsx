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
  createSeatCharge,
  getApplications,
  reviewApplication,
} from "@/lib/services/admission.service";
import { getRooms } from "@/lib/services/inventory.service";
import type { Room, SeatApplication, SeatApplicationStatus } from "@/lib/types";
import { ClipboardList, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type ReviewableStatus = Extract<SeatApplicationStatus, "APPROVED" | "REJECTED">;

export default function AdmissionsManagement() {
  const [applications, setApplications] = useState<SeatApplication[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SeatApplicationStatus | "">(
    "",
  );
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [creatingChargeId, setCreatingChargeId] = useState<string | null>(null);
  const [allocatingId, setAllocatingId] = useState<string | null>(null);
  const [chargeAmounts, setChargeAmounts] = useState<Record<string, string>>(
    {},
  );
  const [selectedRooms, setSelectedRooms] = useState<Record<string, string>>(
    {},
  );

  const roomMap = new Map(rooms.map((room) => [room.id, room]));

  const loadApplications = async () => {
    const params: { status?: SeatApplicationStatus } = {};
    if (statusFilter) {
      params.status = statusFilter;
    }

    const res = await getApplications(params);
    setApplications(res.data?.applications ?? []);
  };

  const loadInventory = async () => {
    const [roomsRes] = await Promise.allSettled([getRooms()]);
    if (roomsRes.status === "fulfilled") {
      setRooms(roomsRes.value.data?.rooms ?? []);
    }
  };

  const refreshPage = async () => {
    try {
      await Promise.all([loadApplications(), loadInventory()]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      try {
        const params: { status?: SeatApplicationStatus } = {};
        if (statusFilter) {
          params.status = statusFilter;
        }

        const [applicationsRes, roomsRes] = await Promise.allSettled([
          getApplications(params),
          getRooms(),
        ]);

        if (applicationsRes.status === "fulfilled") {
          setApplications(applicationsRes.value.data?.applications ?? []);
        }
        if (roomsRes.status === "fulfilled") {
          setRooms(roomsRes.value.data?.rooms ?? []);
        }
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [statusFilter]);

  const handleReview = async (
    applicationId: string,
    status: ReviewableStatus,
  ) => {
    setReviewingId(applicationId);
    setError(null);
    setSuccess(null);

    try {
      await reviewApplication(applicationId, { status });
      setSuccess(`Application ${status.toLowerCase()} successfully.`);
      await refreshPage();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  const handleCreateCharge = async (application: SeatApplication) => {
    const amount = Number(chargeAmounts[application.id]);

    if (!amount || amount <= 0) {
      setError("Enter a valid seat charge amount.");
      return;
    }

    setCreatingChargeId(application.id);
    setError(null);
    setSuccess(null);

    try {
      await createSeatCharge(application.id, { amount });
      setSuccess("Seat allocation charge created successfully.");
      setChargeAmounts((prev) => ({ ...prev, [application.id]: "" }));
      await refreshPage();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreatingChargeId(null);
    }
  };

  const handleAllocate = async (application: SeatApplication) => {
    const roomId = selectedRooms[application.id];

    if (!roomId) {
      setError("Select an available room before allocating.");
      return;
    }

    setAllocatingId(application.id);
    setError(null);
    setSuccess(null);

    try {
      await allocateSeat({
        applicationId: application.id,
        roomId,
      });
      setSuccess("Seat allocated successfully.");
      setSelectedRooms((prev) => ({ ...prev, [application.id]: "" }));
      await refreshPage();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setAllocatingId(null);
    }
  };

  const availableRoomOptions = rooms
    .filter((room) => room.currentOccupancy < room.capacity)
    .map((room) => ({
      id: room.id,
      label: `Room ${room.roomNumber} (${room.currentOccupancy}/${room.capacity})`,
    }));

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
        <h2 className="flex items-center gap-3 text-3xl font-bold text-foreground">
          <ClipboardList className="h-8 w-8" />
          Admissions Management
        </h2>
        <p className="mt-1 text-muted-foreground">
          Approve applications, issue seat charges, confirm payment, and
          allocate available rooms.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
          {success}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
          <Button
            key={status || "all"}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status || "All"}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
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
                  <TableHead>Application</TableHead>
                  <TableHead>Seat Charge</TableHead>
                  <TableHead>Room Allocation</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-mono text-xs">
                      #{application.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {application.studentName ??
                          `Student #${application.studentId.slice(0, 8)}`}
                      </div>
                      {application.studentEmail ? (
                        <div className="text-xs text-muted-foreground">
                          {application.studentEmail}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>{application.rollNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {application.academicDepartment}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {application.session}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          application.status === "APPROVED"
                            ? "default"
                            : application.status === "REJECTED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {application.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {application.seatCharge ? (
                        <div className="space-y-1">
                          <div className="font-medium">
                            BDT {application.seatCharge.amount}
                          </div>
                          <Badge
                            variant={
                              application.seatCharge.dueStatus === "PAID"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {application.seatCharge.dueStatus}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not issued
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {application.seatCharge?.dueStatus !== "PAID" ? (
                        <span className="text-sm text-muted-foreground">
                          Visible after payment
                        </span>
                      ) : application.roomAllocation ? (
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            Room Allocated
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Room:{" "}
                            {application.roomAllocation.roomId.slice(0, 8)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            by {application.roomAllocation.allocatedByName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not allocated
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(application.createdAt).toLocaleDateString(
                        "en-GB",
                      )}
                    </TableCell>
                    <TableCell>
                      {application.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600"
                            onClick={() =>
                              handleReview(application.id, "APPROVED")
                            }
                            disabled={reviewingId === application.id}
                          >
                            {reviewingId === application.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() =>
                              handleReview(application.id, "REJECTED")
                            }
                            disabled={reviewingId === application.id}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : null}

                      {application.status === "APPROVED" &&
                      !application.seatCharge ? (
                        <div className="flex min-w-65 items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            placeholder="Seat charge"
                            value={chargeAmounts[application.id] ?? ""}
                            onChange={(event) =>
                              setChargeAmounts((prev) => ({
                                ...prev,
                                [application.id]: event.target.value,
                              }))
                            }
                            className="h-9"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleCreateCharge(application)}
                            disabled={creatingChargeId === application.id}
                          >
                            {creatingChargeId === application.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Create Charge
                          </Button>
                        </div>
                      ) : null}

                      {application.status === "APPROVED" &&
                      application.seatCharge?.dueStatus === "UNPAID" ? (
                        <span className="text-sm text-muted-foreground">
                          Waiting for student payment.
                        </span>
                      ) : null}

                      {application.status === "APPROVED" &&
                      application.canAllocate ? (
                        <div className="flex min-w-70 items-center gap-2">
                          <select
                            value={selectedRooms[application.id] ?? ""}
                            onChange={(event) =>
                              setSelectedRooms((prev) => ({
                                ...prev,
                                [application.id]: event.target.value,
                              }))
                            }
                            className="flex h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="">Select available room</option>
                            {availableRoomOptions.map((room) => (
                              <option key={room.id} value={room.id}>
                                {room.label}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            onClick={() => handleAllocate(application)}
                            disabled={
                              allocatingId === application.id ||
                              availableRoomOptions.length === 0
                            }
                          >
                            {allocatingId === application.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Allocate
                          </Button>
                        </div>
                      ) : null}
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
