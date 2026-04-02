"use client";

import PaymentSuccessModal from "@/components/PaymentSuccessModal";
import type { PaymentSuccessData } from "@/lib/types";
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
import {
  bookMealTokens,
  cancelMealToken,
  getMyActiveTokens,
  getMyTokenHistory,
  getTomorrowMenus,
} from "@/lib/services/dining.service";
import type { MealMenu, MealToken, PaymentMethod } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/types";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";

type Menus = {
  lunch: MealMenu[];
  dinner: MealMenu[];
};

type BookingState = Record<
  string,
  {
    quantity: number;
    paymentMethod: PaymentMethod;
  }
>;

const DEFAULT_PAYMENT_METHOD: PaymentMethod = "BKASH";

export default function DiningPage() {
  const [menus, setMenus] = useState<Menus>({ lunch: [], dinner: [] });
  const [activeTokens, setActiveTokens] = useState<MealToken[]>([]);
  const [history, setHistory] = useState<MealToken[]>([]);
  const [bookingState, setBookingState] = useState<BookingState>({});
  const [loading, setLoading] = useState(true);
  const [bookingMenuId, setBookingMenuId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] =
    useState<PaymentSuccessData | null>(null);

  const getBookingOptions = (menuId: string) =>
    bookingState[menuId] ?? {
      quantity: 1,
      paymentMethod: DEFAULT_PAYMENT_METHOD,
    };

  const updateBookingOptions = (
    menuId: string,
    patch: Partial<{ quantity: number; paymentMethod: PaymentMethod }>,
  ) => {
    setBookingState((prev) => ({
      ...prev,
      [menuId]: {
        ...getBookingOptions(menuId),
        ...patch,
      },
    }));
  };

  const fetchData = async () => {
    try {
      const [menusRes, tokensRes, historyRes] = await Promise.allSettled([
        getTomorrowMenus(),
        getMyActiveTokens(),
        getMyTokenHistory({ limit: 50 }),
      ]);

      if (menusRes.status === "fulfilled") {
        setMenus(menusRes.value.data.menus);
      }
      if (tokensRes.status === "fulfilled") {
        setActiveTokens(tokensRes.value.data.tokens ?? []);
      }
      if (historyRes.status === "fulfilled") {
        setHistory(historyRes.value.data.tokens ?? []);
      }
      if (
        menusRes.status === "rejected" &&
        tokensRes.status === "rejected" &&
        historyRes.status === "rejected"
      ) {
        throw menusRes.reason;
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleBook = async (menu: MealMenu) => {
    const options = getBookingOptions(menu.id);

    setBookingMenuId(menu.id);
    setError(null);
    setSuccess(null);

    try {
      const res = await bookMealTokens({
        menuId: menu.id,
        quantity: options.quantity,
        paymentMethod: options.paymentMethod,
      });

      // Show payment success modal
      setPaymentSuccess({
        type: "MEAL",
        amount: res.data.totalAmount,
        transactionId: res.data.transactionId,
        paymentMethod: options.paymentMethod,
        details: {
          "Meal Type": res.data.mealType?.replace(/_/g, " ") || "N/A",
          "Meal Date": res.data.mealDate || "Tomorrow",
          Tokens: String(res.data.quantity),
          Menu: menu.menuDescription || "N/A",
        },
      });

      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBookingMenuId(null);
    }
  };

  const handleCancel = async (tokenId: string) => {
    setCancellingId(tokenId);
    setError(null);
    setSuccess(null);

    try {
      await cancelMealToken(tokenId);
      setSuccess("Token cancelled successfully.");
      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

  const renderMenuSection = (title: string, items: MealMenu[]) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((menu) => {
            const options = getBookingOptions(menu.id);
            const total = menu.price * options.quantity;

            return (
              <Card key={menu.id} className="border-border/60">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg">
                      {menu.mealType.replace(/_/g, " ")}
                    </CardTitle>
                    <Badge variant="outline">
                      {menu.availableTokens}/{menu.totalTokens} left
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {menu.menuDescription}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Quantity</span>
                      <input
                        type="number"
                        min={1}
                        max={Math.min(menu.availableTokens, 20)}
                        value={options.quantity}
                        onChange={(event) =>
                          updateBookingOptions(menu.id, {
                            quantity: Math.max(
                              1,
                              Math.min(
                                Number(event.target.value) || 1,
                                Math.min(menu.availableTokens, 20),
                              ),
                            ),
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Payment Method</span>
                      <select
                        value={options.paymentMethod}
                        onChange={(event) =>
                          updateBookingOptions(menu.id, {
                            paymentMethod: event.target.value as PaymentMethod,
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Payable now
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        BDT {total}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleBook(menu)}
                      disabled={
                        bookingMenuId === menu.id || menu.availableTokens <= 0
                      }
                    >
                      {bookingMenuId === menu.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Pay & Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
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
          <UtensilsCrossed className="h-8 w-8" />
          Dining
        </h2>
        <p className="mt-1 text-muted-foreground">
          Pay for tomorrow&apos;s meals while booking, then manage your active
          and past tokens.
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

      <Tabs defaultValue="menus">
        <TabsList>
          <TabsTrigger value="menus">Tomorrow&apos;s Menus</TabsTrigger>
          <TabsTrigger value="active">
            Active Tokens ({activeTokens.length})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="menus" className="mt-6">
          {menus.lunch.length === 0 && menus.dinner.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No menus are available for tomorrow yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {renderMenuSection("Lunch", menus.lunch)}
              {renderMenuSection("Dinner", menus.dinner)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {activeTokens.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No active meal tokens.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTokens.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell className="font-mono text-xs">
                          #{token.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {token.mealType.replace(/_/g, " ")}
                          </div>
                          {token.menuDescription ? (
                            <div className="text-xs text-muted-foreground">
                              {token.menuDescription}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(token.mealDate).toLocaleDateString("en-GB")}
                        </TableCell>
                        <TableCell>{token.quantity}</TableCell>
                        <TableCell className="font-semibold">
                          BDT {token.totalAmount}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(token.id)}
                            disabled={cancellingId === token.id}
                          >
                            {cancellingId === token.id ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : null}
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No token history yet.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell className="font-mono text-xs">
                          #{token.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {token.mealType.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(token.mealDate).toLocaleDateString("en-GB")}
                        </TableCell>
                        <TableCell>{token.quantity}</TableCell>
                        <TableCell className="font-semibold">
                          BDT {token.totalAmount}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              token.status === "CANCELLED"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {token.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <PaymentSuccessModal
        data={paymentSuccess}
        onClose={() => setPaymentSuccess(null)}
      />
    </div>
  );
}
