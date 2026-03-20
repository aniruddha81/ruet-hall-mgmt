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
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import {
  createDue,
  createExpense,
  getExpenses,
  getStudentLedger,
  payDue,
} from "@/lib/services/finance.service";
import {
  DUE_TYPES,
  FINANCE_PAYMENT_METHODS,
  HALLS,
  type DueType,
  type Expense,
  type FinancePaymentMethod,
  type Hall,
  type MealPayment,
  type Payment,
  type StudentDue,
  type StudentLedger,
} from "@/lib/types";
import { CreditCard, Loader2, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function FinanceManagement() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create due form
  const [showDueForm, setShowDueForm] = useState(false);
  const [dueForm, setDueForm] = useState({
    studentId: "",
    hall: user?.hall ?? ("ZIA_HALL" as Hall),
    dueType: "RENT" as DueType,
    amount: "",
  });
  const [creatingDue, setCreatingDue] = useState(false);

  // Pay due form
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState({
    dueId: "",
    method: "CASH" as FinancePaymentMethod,
  });
  const [payingDue, setPayingDue] = useState(false);

  // Create expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "",
  });
  const [creatingExpense, setCreatingExpense] = useState(false);

  // Student ledger lookup
  const [ledgerStudentId, setLedgerStudentId] = useState("");
  const [ledger, setLedger] = useState<StudentLedger | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const fetchExpenses = async () => {
    try {
      const res = await getExpenses();
      setExpenses(res.data?.expenses ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCreateDue = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingDue(true);
    setError(null);
    setSuccess(null);
    try {
      await createDue({
        studentId: dueForm.studentId,
        hall: dueForm.hall,
        dueType: dueForm.dueType,
        amount: Number(dueForm.amount),
      });
      setSuccess("Due created successfully!");
      setShowDueForm(false);
      setDueForm({
        studentId: "",
        hall: user?.hall ?? ("ZIA_HALL" as Hall),
        dueType: "RENT",
        amount: "",
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreatingDue(false);
    }
  };

  const handlePayDue = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayingDue(true);
    setError(null);
    setSuccess(null);
    try {
      await payDue(payForm.dueId, {
        method: payForm.method,
      });
      setSuccess("Payment recorded successfully!");
      setShowPayForm(false);
      setPayForm({ dueId: "", method: "CASH" });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPayingDue(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingExpense(true);
    setError(null);
    setSuccess(null);
    try {
      await createExpense({
        hall: user?.hall ?? ("ZIA_HALL" as Hall),
        title: expenseForm.title,
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
      });
      setSuccess("Expense created successfully!");
      setShowExpenseForm(false);
      setExpenseForm({ title: "", amount: "", category: "" });
      await fetchExpenses();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreatingExpense(false);
    }
  };

  const handleLookupLedger = async () => {
    if (!ledgerStudentId) return;
    setLoadingLedger(true);
    setError(null);
    try {
      const res = await getStudentLedger(ledgerStudentId);
      setLedger(res.data ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingLedger(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <CreditCard className="h-8 w-8" />
            Finance Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage dues, payments, and expenses
          </p>
        </div>
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

      <Tabs defaultValue="dues">
        <TabsList>
          <TabsTrigger value="dues">Dues & Payments</TabsTrigger>
          <TabsTrigger value="expenses">
            Expenses ({expenses.length})
          </TabsTrigger>
          <TabsTrigger value="ledger">Student Ledger</TabsTrigger>
        </TabsList>

        {/* =================== Dues Tab =================== */}
        <TabsContent value="dues" className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowDueForm(!showDueForm);
                setShowPayForm(false);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Create Due
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowPayForm(!showPayForm);
                setShowDueForm(false);
              }}
            >
              Record Payment
            </Button>
          </div>

          {showDueForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create Due</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDue} className="space-y-4 max-w-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Student ID</Label>
                      <Input
                        value={dueForm.studentId}
                        onChange={(e) =>
                          setDueForm({ ...dueForm, studentId: e.target.value })
                        }
                        placeholder="e.g. abc123..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (৳)</Label>
                      <Input
                        type="number"
                        value={dueForm.amount}
                        onChange={(e) =>
                          setDueForm({ ...dueForm, amount: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Due Type</Label>
                      <select
                        value={dueForm.dueType}
                        onChange={(e) =>
                          setDueForm({
                            ...dueForm,
                            dueType: e.target.value as DueType,
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {DUE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hall</Label>
                      <select
                        value={dueForm.hall}
                        onChange={(e) =>
                          setDueForm({
                            ...dueForm,
                            hall: e.target.value as Hall,
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {HALLS.map((h) => (
                          <option key={h} value={h}>
                            {h.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={creatingDue}>
                      {creatingDue && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}{" "}
                      Create
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDueForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {showPayForm && (
            <Card>
              <CardHeader>
                <CardTitle>Record Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePayDue} className="space-y-4 max-w-lg">
                  <div className="space-y-2">
                    <Label>Due ID</Label>
                    <Input
                      value={payForm.dueId}
                      onChange={(e) =>
                        setPayForm({ ...payForm, dueId: e.target.value })
                      }
                      placeholder="Due ID"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <select
                      value={payForm.method}
                      onChange={(e) =>
                        setPayForm({
                          ...payForm,
                          method: e.target.value as FinancePaymentMethod,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {FINANCE_PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={payingDue}>
                      {payingDue && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}{" "}
                      Record
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPayForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* =================== Expenses Tab =================== */}
        <TabsContent value="expenses" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowExpenseForm(!showExpenseForm)}>
              <Plus className="h-4 w-4 mr-2" /> New Expense
            </Button>
          </div>

          {showExpenseForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleCreateExpense}
                  className="space-y-4 max-w-lg"
                >
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={expenseForm.title}
                      onChange={(e) =>
                        setExpenseForm({
                          ...expenseForm,
                          title: e.target.value,
                        })
                      }
                      placeholder="e.g. Electricity bill"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount (৳)</Label>
                      <Input
                        type="number"
                        value={expenseForm.amount}
                        onChange={(e) =>
                          setExpenseForm({
                            ...expenseForm,
                            amount: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input
                        value={expenseForm.category}
                        onChange={(e) =>
                          setExpenseForm({
                            ...expenseForm,
                            category: e.target.value,
                          })
                        }
                        placeholder="e.g. Utilities"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={creatingExpense}>
                      {creatingExpense && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}{" "}
                      Create
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowExpenseForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              {expenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No expenses recorded.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Hall</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="font-mono text-xs">
                          #{exp.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {exp.title}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ৳{exp.amount}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {exp.category}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {exp.hall?.replace(/_/g, " ") ?? "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {exp.createdAt
                            ? new Date(exp.createdAt).toLocaleDateString(
                                "en-GB",
                              )
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================== Student Ledger Tab =================== */}
        <TabsContent value="ledger" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lookup Student Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 max-w-sm">
                <Input
                  placeholder="Student ID"
                  value={ledgerStudentId}
                  onChange={(e) => setLedgerStudentId(e.target.value)}
                />
                <Button onClick={handleLookupLedger} disabled={loadingLedger}>
                  {loadingLedger ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Lookup
                </Button>
              </div>
            </CardContent>
          </Card>

          {ledger && (
            <>
              {/* Dues */}
              <Card>
                <CardHeader>
                  <CardTitle>Dues ({ledger.dues?.length ?? 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {(ledger.dues?.length ?? 0) === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No dues found.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Hall</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledger.dues.map((due: StudentDue) => (
                          <TableRow key={due.id}>
                            <TableCell className="font-mono text-xs">
                              #{due.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{due.dueType}</Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              ৳{due.amount}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {due.hall?.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  due.dueStatus === "PAID"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {due.dueStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {due.createdAt
                                ? new Date(due.createdAt).toLocaleDateString(
                                    "en-GB",
                                  )
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Payments */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Payments ({ledger.payments?.length ?? 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(ledger.payments?.length ?? 0) === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No payments found.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Due ID</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Hall</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledger.payments.map((payment: Payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-mono text-xs">
                              #{payment.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {payment.dueId ? `#${payment.dueId.slice(0, 8)}` : "-"}
                            </TableCell>
                            <TableCell className="font-semibold">
                              ৳{payment.amount}
                            </TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {payment.hall?.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {payment.createdAt
                                ? new Date(
                                    payment.createdAt,
                                  ).toLocaleDateString("en-GB")
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Meal Payments */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Meal Payments ({ledger.mealPayments?.length ?? 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(ledger.mealPayments?.length ?? 0) === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No meal payments found.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Transaction</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledger.mealPayments.map((mp: MealPayment) => (
                          <TableRow key={mp.id}>
                            <TableCell className="font-mono text-xs">
                              #{mp.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              ৳{mp.amount}
                            </TableCell>
                            <TableCell>{mp.totalQuantity}</TableCell>
                            <TableCell>{mp.paymentMethod}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {mp.transactionId?.slice(0, 12) ?? "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {mp.paymentDate
                                ? new Date(mp.paymentDate).toLocaleDateString(
                                    "en-GB",
                                  )
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
