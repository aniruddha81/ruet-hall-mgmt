"use client";

import PaymentSuccessModal from "@/components/PaymentSuccessModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import {
  applyForSeat,
  getMyApplicationStatus,
} from "@/lib/services/admission.service";
import { payMyDue } from "@/lib/services/finance.service";
import {
  FINANCE_PAYMENT_METHODS,
  HALLS,
  type FinancePaymentMethod,
  type Hall,
  type PaymentSuccessData,
  type SeatApplication,
} from "@/lib/types";
import { ClipboardList, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const DEFAULT_METHOD: FinancePaymentMethod = "ONLINE";

export default function AdmissionPage() {
  const { user } = useAuth();
  const [application, setApplication] = useState<SeatApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payingSeatCharge, setPayingSeatCharge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hall, setHall] = useState<Hall | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<FinancePaymentMethod>(DEFAULT_METHOD);
  const [bankReceiptImage, setBankReceiptImage] = useState<File | null>(null);
  const [paymentSuccess, setPaymentSuccess] =
    useState<PaymentSuccessData | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await getMyApplicationStatus();
      setApplication(res.data ?? null);
    } catch {
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
  }, []);

  const handleApply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setError("User data not found");
      return;
    }
    if (!hall) {
      setError("Please select a hall");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await applyForSeat({
        hall,
        academicDepartment: user.academicDepartment,
        session: user.session,
      });
      setSuccess("Application submitted successfully.");
      await fetchStatus();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaySeatCharge = async () => {
    if (
      !application?.seatCharge ||
      application.seatCharge.dueStatus === "PAID"
    ) {
      return;
    }

    setPayingSeatCharge(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await payMyDue(application.seatCharge.id, {
        method: paymentMethod,
        receiptImage: paymentMethod === "BANK" ? bankReceiptImage : null,
      });

      setPaymentSuccess({
        type: "DUE",
        amount: res.data.amount,
        transactionId: res.data.transactionId,
        paymentMethod,
        details: {
          "Due Type": application.seatCharge.dueType,
          Hall: application.hall.replace(/_/g, " "),
          "Due Reference": `#${application.seatCharge.id.slice(0, 8)}`,
          Status: "PAID",
        },
      });

      setSuccess("Seat charge paid successfully.");
      await fetchStatus();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPayingSeatCharge(false);
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
        <h2 className="flex items-center gap-3 text-3xl font-bold text-foreground">
          <ClipboardList className="h-8 w-8" />
          Seat Application
        </h2>
        <p className="mt-1 text-muted-foreground">
          Apply for a hall seat, track approval, and pay the allocation charge
          once it is issued.
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

      {application ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Application</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
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
                  className="mt-2"
                >
                  {application.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Applied On</p>
                <p className="mt-2 font-medium">
                  {new Date(application.createdAt).toLocaleDateString("en-GB")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hall</p>
                <p className="mt-2 font-medium">
                  {application.hall.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="mt-2 font-medium">
                  {application.academicDepartment}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Session</p>
                <p className="mt-2 font-medium">{application.session}</p>
              </div>
              {application.reviewedAt ? (
                <div>
                  <p className="text-sm text-muted-foreground">Reviewed On</p>
                  <p className="mt-2 font-medium">
                    {new Date(application.reviewedAt).toLocaleDateString(
                      "en-GB",
                    )}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {application.status === "APPROVED" ? (
            <Card>
              <CardHeader>
                <CardTitle>Seat Allocation Charge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.seatCharge ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Charge Type
                        </p>
                        <p className="mt-2 font-medium">
                          {application.seatCharge.dueType}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="mt-2 text-2xl font-bold">
                          BDT {application.seatCharge.amount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Payment Status
                        </p>
                        <Badge
                          variant={
                            application.seatCharge.dueStatus === "PAID"
                              ? "default"
                              : "destructive"
                          }
                          className="mt-2"
                        >
                          {application.seatCharge.dueStatus}
                        </Badge>
                      </div>
                    </div>

                    {application.seatCharge.dueStatus === "PAID" ? (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
                          Your seat charge is paid. The hall office can now
                          allocate your room.
                        </div>
                        {application.roomAllocation ? (
                          <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950">
                            <CardHeader>
                              <CardTitle className="text-emerald-700 dark:text-emerald-400">
                                Room Allocated
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                              <div>
                                <p className="text-sm text-emerald-600 dark:text-emerald-300">
                                  Room No
                                </p>
                                <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                  {application.roomAllocation.roomNo}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-emerald-600 dark:text-emerald-300">
                                  Allocated On
                                </p>
                                <p className="mt-2 font-medium text-emerald-700 dark:text-emerald-400">
                                  {new Date(
                                    application.roomAllocation.allocatedAt,
                                  ).toLocaleDateString("en-GB")}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-emerald-600 dark:text-emerald-300">
                                  Allocated By
                                </p>
                                <p className="mt-2 font-medium text-emerald-700 dark:text-emerald-400">
                                  {application.roomAllocation.allocatedByName}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-4 rounded-lg border border-border/60 p-4">
                        <label className="space-y-2 text-sm">
                          <span className="font-medium">Payment Method</span>
                          <select
                            value={paymentMethod}
                            onChange={(event) =>
                              setPaymentMethod(
                                event.target.value as FinancePaymentMethod,
                              )
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:max-w-xs"
                          >
                            {FINANCE_PAYMENT_METHODS.map((method) => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                        </label>
                        {paymentMethod === "BANK" ? (
                          <label className="space-y-2 text-sm">
                            <span className="font-medium">
                              Bank Receipt (PDF/Image)
                            </span>
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              required
                              onChange={(event) =>
                                setBankReceiptImage(
                                  event.target.files?.[0] ?? null,
                                )
                              }
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:max-w-xs"
                            />
                          </label>
                        ) : null}
                        <Button
                          onClick={handlePaySeatCharge}
                          disabled={
                            payingSeatCharge ||
                            (paymentMethod === "BANK" && !bankReceiptImage)
                          }
                        >
                          {payingSeatCharge ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Pay Seat Charge
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                    Your application is approved. The hall office still needs to
                    publish the seat allocation charge before you can pay it.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Apply for Hall Seat</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApply} className="max-w-lg space-y-4">
              <p className="text-sm text-muted-foreground">
                Your profile details will be used automatically for this
                application.
              </p>
              <div className="grid gap-4 rounded-lg bg-muted/50 p-4 md:grid-cols-2">
                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="text-xs text-muted-foreground">Hall</span>
                  <select
                    id="hall"
                    name="hall"
                    required
                    value={hall ?? ""}
                    onChange={(event) => setHall(event.target.value as Hall)}
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select a hall</option>
                    {HALLS.map((item) => (
                      <option key={item} value={item}>
                        {item.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </label>
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
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Submit Application
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <PaymentSuccessModal
        data={paymentSuccess}
        onClose={() => setPaymentSuccess(null)}
      />
    </div>
  );
}
