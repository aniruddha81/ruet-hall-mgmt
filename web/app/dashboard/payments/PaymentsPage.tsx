"use client";

import PaymentSuccessModal from "@/components/PaymentSuccessModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getMyLedger, payMyDue } from "@/lib/services/finance.service";
import type {
  FinancePaymentMethod,
  MealPayment,
  Payment,
  PaymentSuccessData,
  StudentDue,
} from "@/lib/types";
import { FINANCE_PAYMENT_METHODS } from "@/lib/types";
import {
  AlertTriangle,
  CreditCard,
  Loader2,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

const DEFAULT_METHOD: FinancePaymentMethod = "ONLINE";

export default function PaymentsPage() {
  const [dues, setDues] = useState<StudentDue[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [mealPayments, setMealPayments] = useState<MealPayment[]>([]);
  const [summary, setSummary] = useState({ totalDue: 0, totalPaid: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [payingDueId, setPayingDueId] = useState<string | null>(null);
  const [dueMethods, setDueMethods] = useState<
    Record<string, FinancePaymentMethod>
  >({});
  const [dueReceipts, setDueReceipts] = useState<Record<string, File | null>>(
    {},
  );
  const [paymentSuccess, setPaymentSuccess] =
    useState<PaymentSuccessData | null>(null);

  const fetchData = async () => {
    try {
      const ledgerRes = await getMyLedger();

      setDues(ledgerRes.data.dues);
      setPayments(ledgerRes.data.payments);
      setMealPayments(ledgerRes.data.mealPayments);
      setSummary(ledgerRes.data.summary);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handlePayDue = async (due: StudentDue) => {
    const method = dueMethods[due.id] ?? DEFAULT_METHOD;

    setPayingDueId(due.id);
    setError(null);
    setSuccess(null);

    try {
      const res = await payMyDue(due.id, {
        method,
        receiptImage: method === "BANK" ? (dueReceipts[due.id] ?? null) : null,
      });

      // Show payment success modal
      setPaymentSuccess({
        type: "DUE",
        amount: res.data.amount,
        transactionId: res.data.transactionId,
        paymentMethod: method,
        details: {
          "Due Type": due.dueType,
          Hall: due.hall.replace(/_/g, " "),
          "Due Reference": `#${due.id.slice(0, 8)}`,
          Status: "PAID",
        },
      });

      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPayingDueId(null);
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
        <h2 className="text-3xl font-bold text-foreground">
          Payments & Finance
        </h2>
        <p className="mt-1 text-muted-foreground">
          Pay hall dues, review completed transactions, and keep track of meal
          purchases.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unpaid Dues</p>
                <p className="mt-1 text-2xl font-bold text-destructive">
                  BDT {summary.totalDue}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-destructive/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hall Payments</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  BDT {summary.totalPaid}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-emerald-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meal Payments</p>
                <p className="mt-1 text-2xl font-bold">{mealPayments.length}</p>
              </div>
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dues">
        <TabsList>
          <TabsTrigger value="dues">Dues</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="meal-payments">Meal Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="dues">
          <Card>
            <CardHeader>
              <CardTitle>My Dues</CardTitle>
            </CardHeader>
            <CardContent>
              {dues.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No dues found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Hall</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dues.map((due) => (
                      <TableRow key={due.id}>
                        <TableCell className="font-medium">
                          {due.dueType}
                        </TableCell>
                        <TableCell>{due.hall.replace(/_/g, " ")}</TableCell>
                        <TableCell className="font-semibold">
                          BDT {due.amount}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              due.dueStatus === "PAID"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {due.dueStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(due.createdAt).toLocaleDateString("en-GB")}
                        </TableCell>
                        <TableCell>
                          {due.dueStatus === "PAID" ? (
                            <span className="text-sm text-muted-foreground">
                              Paid{" "}
                              {due.paidAt
                                ? new Date(due.paidAt).toLocaleDateString(
                                    "en-GB",
                                  )
                                : ""}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <select
                                value={dueMethods[due.id] ?? DEFAULT_METHOD}
                                onChange={(event) =>
                                  setDueMethods((prev) => ({
                                    ...prev,
                                    [due.id]: event.target
                                      .value as FinancePaymentMethod,
                                  }))
                                }
                                className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
                              >
                                {FINANCE_PAYMENT_METHODS.map((method) => (
                                  <option key={method} value={method}>
                                    {method}
                                  </option>
                                ))}
                              </select>
                              {(dueMethods[due.id] ?? DEFAULT_METHOD) ===
                              "BANK" ? (
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) =>
                                    setDueReceipts((prev) => ({
                                      ...prev,
                                      [due.id]: event.target.files?.[0] ?? null,
                                    }))
                                  }
                                  className="flex h-9 max-w-55 rounded-md border border-input bg-background px-2 text-xs"
                                />
                              ) : null}
                              <Button
                                size="sm"
                                onClick={() => handlePayDue(due)}
                                disabled={
                                  payingDueId === due.id ||
                                  ((dueMethods[due.id] ?? DEFAULT_METHOD) ===
                                    "BANK" &&
                                    !dueReceipts[due.id])
                                }
                              >
                                {payingDueId === due.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Pay Now
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Hall Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No hall payments yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hall</TableHead>
                      <TableHead>Due ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.hall.replace(/_/g, " ")}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {payment.dueId
                            ? `#${payment.dueId.slice(0, 8)}`
                            : "-"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          BDT {payment.amount}
                        </TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>
                          {payment.bankReceiptUrl ? (
                            <a
                              href={payment.bankReceiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {payment.method === "BANK" ? (
                            <Badge
                              variant={
                                payment.receiptVerifiedAt
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {payment.receiptVerifiedAt
                                ? "Verified"
                                : "Pending"}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString(
                            "en-GB",
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meal-payments">
          <Card>
            <CardHeader>
              <CardTitle>Meal Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {mealPayments.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No meal payments yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Refund</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mealPayments.map((mealPayment) => (
                      <TableRow key={mealPayment.id}>
                        <TableCell className="font-semibold">
                          BDT {mealPayment.amount}
                        </TableCell>
                        <TableCell>{mealPayment.totalQuantity}</TableCell>
                        <TableCell>{mealPayment.paymentMethod}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {mealPayment.transactionId}
                        </TableCell>
                        <TableCell>
                          {mealPayment.bankReceiptUrl ? (
                            <a
                              href={mealPayment.bankReceiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {mealPayment.paymentMethod === "BANK" ? (
                            <Badge
                              variant={
                                mealPayment.receiptVerifiedAt
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {mealPayment.receiptVerifiedAt
                                ? "Verified"
                                : "Pending"}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(mealPayment.paymentDate).toLocaleDateString(
                            "en-GB",
                          )}
                        </TableCell>
                        <TableCell>
                          {mealPayment.refundAmount ? (
                            <Badge variant="secondary">
                              BDT {mealPayment.refundAmount}
                            </Badge>
                          ) : (
                            "-"
                          )}
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

      <PaymentSuccessModal
        data={paymentSuccess}
        onClose={() => setPaymentSuccess(null)}
      />
    </div>
  );
}
