"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApiErrorMessage } from "@/lib/api";
import {
  getDamageReports,
  getRooms,
  markDamageFixed,
  verifyDamageReport,
} from "@/lib/services/inventory.service";
import type { DamageReport, Room } from "@/lib/types";
import { Building, ClipboardList, Loader2, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

type ComplaintActionMode = "STUDENT_FINE" | "MANAGER_COST";

type ComplaintFormState = {
  mode: ComplaintActionMode;
  amount: string;
  managerNote: string;
};

const currencyFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

function defaultComplaintForm(report: DamageReport): ComplaintFormState {
  if (report.isStudentResponsible === false) {
    return {
      mode: "MANAGER_COST",
      amount: String(report.damageCost ?? 0),
      managerNote: report.managerNote ?? "",
    };
  }

  return {
    mode: "STUDENT_FINE",
    amount: String(report.fineAmount ?? 0),
    managerNote: report.managerNote ?? "",
  };
}

function getReportDateLabel(value: string | null | undefined) {
  if (!value) return "N/A";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";

  return parsed.toLocaleString();
}

export default function InventoryManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [complaintForms, setComplaintForms] = useState<
    Record<string, ComplaintFormState>
  >({});
  const [submittingComplaintId, setSubmittingComplaintId] = useState<
    string | null
  >(null);
  const [fixingComplaintId, setFixingComplaintId] = useState<string | null>(
    null,
  );

  const getFormFromState = (
    forms: Record<string, ComplaintFormState>,
    report: DamageReport,
  ): ComplaintFormState => {
    return forms[report.id] ?? defaultComplaintForm(report);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [roomsRes, reportsRes] = await Promise.all([
        getRooms(),
        getDamageReports(),
      ]);

      setRooms(roomsRes.data?.rooms ?? []);

      const reports = reportsRes.data?.reports ?? [];
      setDamageReports(reports);
      setComplaintForms((prev) => {
        const next: Record<string, ComplaintFormState> = {};
        reports.forEach((report) => {
          next[report.id] = prev[report.id] ?? defaultComplaintForm(report);
        });
        return next;
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const refreshDamageReports = async () => {
    const reportsRes = await getDamageReports();
    const reports = reportsRes.data?.reports ?? [];

    setDamageReports(reports);
    setComplaintForms((prev) => {
      const next: Record<string, ComplaintFormState> = {};
      reports.forEach((report) => {
        next[report.id] = prev[report.id] ?? defaultComplaintForm(report);
      });
      return next;
    });
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const updateComplaintForm = (
    report: DamageReport,
    patch: Partial<ComplaintFormState>,
  ) => {
    setComplaintForms((prev) => ({
      ...prev,
      [report.id]: {
        ...getFormFromState(prev, report),
        ...patch,
      },
    }));
  };

  const handleVerifyComplaint = async (report: DamageReport) => {
    const form = getFormFromState(complaintForms, report);
    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      setError("Please enter a valid non-negative amount.");
      return;
    }

    setSubmittingComplaintId(report.id);
    setError(null);
    setSuccess(null);

    try {
      await verifyDamageReport(report.id, {
        isStudentResponsible: form.mode === "STUDENT_FINE",
        fineAmount: form.mode === "STUDENT_FINE" ? amount : undefined,
        damageCost: form.mode === "MANAGER_COST" ? amount : undefined,
        managerNote: form.managerNote.trim() || undefined,
      });

      setSuccess(
        form.mode === "STUDENT_FINE"
          ? "Complaint verified and student fine assigned."
          : "Complaint verified and manager-side damage cost recorded.",
      );
      await refreshDamageReports();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmittingComplaintId(null);
    }
  };

  const handleMarkFixed = async (reportId: string) => {
    setFixingComplaintId(reportId);
    setError(null);
    setSuccess(null);

    try {
      await markDamageFixed(reportId);
      setSuccess("Complaint marked as fixed and removed from active queue.");
      await refreshDamageReports();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setFixingComplaintId(null);
    }
  };

  const activeComplaints = damageReports.filter(
    (report) => report.status !== "FIXED",
  );
  const reportedComplaints = activeComplaints.filter(
    (report) => report.status === "REPORTED",
  ).length;
  const verifiedComplaints = activeComplaints.filter(
    (report) => report.status === "VERIFIED",
  ).length;

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
          <Building className="h-8 w-8" />
          Inventory Management
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage rooms and damage complaints
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

      <Tabs defaultValue="complaints">
        <TabsList>
          <TabsTrigger value="complaints">
            Complaints ({activeComplaints.length})
          </TabsTrigger>
          <TabsTrigger value="rooms">Rooms ({rooms.length})</TabsTrigger>
        </TabsList>

        {/* Complaints Tab */}
        <TabsContent value="complaints" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Damage Complaints Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Waiting for Assessment
                  </p>
                  <p className="text-2xl font-semibold">{reportedComplaints}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Ready to Mark Fixed
                  </p>
                  <p className="text-2xl font-semibold">{verifiedComplaints}</p>
                </div>
              </div>

              {activeComplaints.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">
                  No active complaints. The queue is clear.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeComplaints.map((report) => {
                      const form = getFormFromState(complaintForms, report);
                      const isSubmitting = submittingComplaintId === report.id;
                      const isFixing = fixingComplaintId === report.id;
                      const isBusy = isSubmitting || isFixing;

                      return (
                        <TableRow key={report.id}>
                          <TableCell className="align-top">
                            <p className="font-mono text-xs">
                              #{report.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getReportDateLabel(report.createdAt)}
                            </p>
                          </TableCell>

                          <TableCell className="align-top">
                            <p className="font-medium">
                              {report.reporterName ??
                                report.studentName ??
                                "Student"}
                            </p>
                            {report.reporterRollNumber && (
                              <p className="text-xs text-muted-foreground">
                                Roll: {report.reporterRollNumber}
                              </p>
                            )}
                          </TableCell>

                          <TableCell className="align-top">
                            <p className="text-sm">
                              {report.locationDescription ??
                                "Location not provided"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {report.assetDetails ?? report.description}
                            </p>
                          </TableCell>

                          <TableCell className="align-top min-w-70">
                            {report.status === "REPORTED" ? (
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <Label htmlFor={`mode-${report.id}`}>
                                    Responsibility
                                  </Label>
                                  <select
                                    id={`mode-${report.id}`}
                                    value={form.mode}
                                    onChange={(e) =>
                                      updateComplaintForm(report, {
                                        mode: e.target
                                          .value as ComplaintActionMode,
                                      })
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    disabled={isBusy}
                                  >
                                    <option value="STUDENT_FINE">
                                      Student caused damage (fine student)
                                    </option>
                                    <option value="MANAGER_COST">
                                      Not student-caused (log manager cost)
                                    </option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <Label htmlFor={`amount-${report.id}`}>
                                    {form.mode === "STUDENT_FINE"
                                      ? "Fine Amount (BDT)"
                                      : "Damage Cost (BDT)"}
                                  </Label>
                                  <Input
                                    id={`amount-${report.id}`}
                                    type="number"
                                    min="0"
                                    value={form.amount}
                                    onChange={(e) =>
                                      updateComplaintForm(report, {
                                        amount: e.target.value,
                                      })
                                    }
                                    disabled={isBusy}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label htmlFor={`note-${report.id}`}>
                                    Manager Note (Optional)
                                  </Label>
                                  <Input
                                    id={`note-${report.id}`}
                                    value={form.managerNote}
                                    onChange={(e) =>
                                      updateComplaintForm(report, {
                                        managerNote: e.target.value,
                                      })
                                    }
                                    placeholder="Brief inspection notes"
                                    disabled={isBusy}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-sm">
                                  {report.isStudentResponsible
                                    ? "Student liable"
                                    : "Manager-side hall maintenance"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {report.isStudentResponsible
                                    ? "Fine"
                                    : "Cost"}
                                  :{" "}
                                  {currencyFormatter.format(
                                    report.isStudentResponsible
                                      ? (report.fineAmount ?? 0)
                                      : (report.damageCost ?? 0),
                                  )}
                                </p>
                                {report.managerNote && (
                                  <p className="text-xs text-muted-foreground">
                                    Note: {report.managerNote}
                                  </p>
                                )}
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="align-top">
                            <Badge
                              variant={
                                report.status === "REPORTED"
                                  ? "secondary"
                                  : report.status === "VERIFIED"
                                    ? "default"
                                    : "outline"
                              }
                            >
                              {report.status}
                            </Badge>
                            {report.fixedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Fixed: {getReportDateLabel(report.fixedAt)}
                              </p>
                            )}
                          </TableCell>

                          <TableCell className="align-top">
                            {report.status === "REPORTED" ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  void handleVerifyComplaint(report)
                                }
                                disabled={isBusy}
                              >
                                {isSubmitting && (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                )}
                                Verify Complaint
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void handleMarkFixed(report.id)}
                                disabled={isBusy}
                              >
                                {isFixing ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Wrench className="h-4 w-4 mr-2" />
                                )}
                                Mark Fixed
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              {rooms.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No rooms found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Room Number</TableHead>
                      <TableHead>Hall</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-mono text-xs">
                          #{room.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {room.roomNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {room.hall?.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>{room.capacity}</TableCell>
                        <TableCell>
                          {room.currentOccupancy}/{room.capacity}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              room.roomStatus === "AVAILABLE"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {room.roomStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
