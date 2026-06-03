"use client";

import PaymentSuccessModal from "@/components/PaymentSuccessModal";
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
  formatHallLabel,
  getHallsWithTomorrowMenus,
  getMealTypesForHall,
  getMenuForHallAndMeal,
  type MealBookingStep,
} from "@/lib/dining-booking";
import {
  bookMealTokens,
  cancelMealToken,
  getMyActiveTokens,
  getMyTokenHistory,
  getTomorrowMenus,
} from "@/lib/services/dining.service";
import type {
  Hall,
  MealBookingReceipt,
  MealMenu,
  MealToken,
  MealType,
  PaymentMethod,
  PaymentSuccessData,
} from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/types";
import { ArrowLeft, Loader2, UtensilsCrossed } from "lucide-react";
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
    receiptImage: File | null;
  }
>;

const DEFAULT_PAYMENT_METHOD: PaymentMethod = "BKASH";

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

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
  const [bookingStep, setBookingStep] = useState<MealBookingStep>("hall");
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(
    null,
  );

  const hallsWithMenus = getHallsWithTomorrowMenus(menus);
  const selectedMenu =
    selectedHall && selectedMealType
      ? getMenuForHallAndMeal(menus, selectedHall, selectedMealType)
      : undefined;

  const resetBookingWizard = () => {
    setBookingStep("hall");
    setSelectedHall(null);
    setSelectedMealType(null);
  };

  const getBookingOptions = (menuId: string) =>
    bookingState[menuId] ?? {
      quantity: 1,
      paymentMethod: DEFAULT_PAYMENT_METHOD,
      receiptImage: null,
    };

  const getAlreadyBookedTokens = (menuId: string) => {
    return activeTokens
      .filter((t) => t.menuId === menuId)
      .reduce((sum, t) => sum + t.quantity, 0);
  };

  const updateBookingOptions = (
    menuId: string,
    patch: Partial<{
      quantity: number;
      paymentMethod: PaymentMethod;
      receiptImage: File | null;
    }>,
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
        receiptImage:
          options.paymentMethod === "BANK" ? options.receiptImage : null,
      });

      if (
        res.data &&
        typeof res.data === "object" &&
        "status" in res.data &&
        res.data.status === "PENDING"
      ) {
        return;
      }

      const booking = res.data as MealBookingReceipt;

      // Show payment success modal
      setPaymentSuccess({
        type: "MEAL",
        amount: booking.totalAmount,
        transactionId: booking.transactionId,
        paymentMethod: options.paymentMethod,
        details: {
          "Meal Type": booking.mealType?.replace(/_/g, " ") || "N/A",
          "Meal Date": booking.mealDate || "Tomorrow",
          Tokens: String(booking.quantity),
          Menu: menu.menuDescription || "N/A",
        },
      });

      resetBookingWizard();
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

  const renderBookingSteps = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className={bookingStep === "hall" ? "font-semibold text-foreground" : ""}>
          1. Choose hall
        </span>
        <span aria-hidden>→</span>
        <span className={bookingStep === "meal" ? "font-semibold text-foreground" : ""}>
          2. Lunch or dinner
        </span>
        <span aria-hidden>→</span>
        <span className={bookingStep === "pay" ? "font-semibold text-foreground" : ""}>
          3. Pay & book
        </span>
      </div>

      {bookingStep === "hall" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hallsWithMenus.map((hall) => {
            const mealTypes = getMealTypesForHall(menus, hall);
            return (
              <Card
                key={hall}
                className="cursor-pointer border-border/60 transition-colors hover:border-primary/40 hover:bg-muted/30"
                onClick={() => {
                  setSelectedHall(hall);
                  setSelectedMealType(null);
                  setBookingStep(
                    mealTypes.length === 1 ? "pay" : "meal",
                  );
                  if (mealTypes.length === 1) {
                    setSelectedMealType(mealTypes[0]);
                  }
                }}
              >
                <CardHeader>
                  <CardTitle className="text-lg">
                    {formatHallLabel(hall)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {mealTypes
                      .map((type) => MEAL_TYPE_LABELS[type])
                      .join(" & ")}{" "}
                    available for tomorrow
                  </p>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      ) : null}

      {bookingStep === "meal" && selectedHall ? (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit"
            onClick={resetBookingWizard}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Change hall
          </Button>
          <p className="text-sm text-muted-foreground">
            Hall:{" "}
            <span className="font-medium text-foreground">
              {formatHallLabel(selectedHall)}
            </span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {getMealTypesForHall(menus, selectedHall).map((mealType) => {
              const menu = getMenuForHallAndMeal(menus, selectedHall, mealType);
              if (!menu) return null;
              return (
                <Card
                  key={mealType}
                  className="cursor-pointer border-border/60 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  onClick={() => {
                    setSelectedMealType(mealType);
                    setBookingStep("pay");
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {MEAL_TYPE_LABELS[mealType]}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {menu.menuDescription}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      BDT {menu.price} per token · {menu.availableTokens} left
                    </p>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}

      {bookingStep === "pay" && selectedMenu ? (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit"
            onClick={() => {
              if (!selectedHall) {
                resetBookingWizard();
                return;
              }
              const mealTypes = getMealTypesForHall(menus, selectedHall);
              setBookingStep(mealTypes.length > 1 ? "meal" : "hall");
              if (mealTypes.length > 1) {
                setSelectedMealType(null);
              } else {
                setSelectedHall(null);
                setSelectedMealType(null);
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {renderPaymentCard(selectedMenu)}
        </div>
      ) : null}
    </div>
  );

  const renderPaymentCard = (menu: MealMenu) => {
    const options = getBookingOptions(menu.id);
    const total = menu.price * options.quantity;

    return (
      <Card className="border-border/60">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg">
              {formatHallLabel(menu.hall)} ·{" "}
              {MEAL_TYPE_LABELS[menu.mealType]}
            </CardTitle>
            <Badge variant="outline">
              {menu.availableTokens}/{menu.totalTokens} left
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{menu.menuDescription}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Quantity</span>
              <input
                type="number"
                min={1}
                max={Math.min(
                  menu.availableTokens,
                  Math.max(0, 20 - getAlreadyBookedTokens(menu.id)),
                )}
                value={options.quantity}
                disabled={
                  Math.max(0, 20 - getAlreadyBookedTokens(menu.id)) === 0
                }
                onChange={(event) =>
                  updateBookingOptions(menu.id, {
                    quantity: Math.max(
                      1,
                      Math.min(
                        Number(event.target.value) || 1,
                        Math.min(
                          menu.availableTokens,
                          Math.max(0, 20 - getAlreadyBookedTokens(menu.id)),
                        ),
                      ),
                    ),
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Payment Method</span>
              <select
                value={options.paymentMethod}
                onChange={(event) =>
                  updateBookingOptions(menu.id, {
                    paymentMethod: event.target.value as PaymentMethod,
                    receiptImage: null,
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
          {options.paymentMethod === "BANK" ? (
            <label className="space-y-2 text-sm">
              <span className="font-medium">Bank Receipt (PDF/Image)</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(event) =>
                  updateBookingOptions(menu.id, {
                    receiptImage: event.target.files?.[0] ?? null,
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
          ) : null}
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Payable now
              </p>
              <p className="text-2xl font-bold text-foreground">BDT {total}</p>
            </div>
            <Button
              onClick={() => handleBook(menu)}
              disabled={
                bookingMenuId === menu.id ||
                menu.availableTokens <= 0 ||
                Math.max(0, 20 - getAlreadyBookedTokens(menu.id)) === 0 ||
                (options.paymentMethod === "BANK" && !options.receiptImage)
              }
            >
              {bookingMenuId === menu.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {Math.max(0, 20 - getAlreadyBookedTokens(menu.id)) === 0
                ? "Max Limit Reached"
                : "Pay & Book"}
            </Button>
          </div>
        </CardContent>
      </Card>
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
          Choose a hall, pick lunch or dinner, then pay for tomorrow&apos;s meal
          tokens. Manage active and past tokens in the other tabs.
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
          <TabsTrigger value="menus">Book Meal Token</TabsTrigger>
          <TabsTrigger value="active">
            Active Tokens ({activeTokens.length})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="menus" className="mt-6">
          {hallsWithMenus.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No menus are available for tomorrow yet.
              </CardContent>
            </Card>
          ) : (
            renderBookingSteps()
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
                      <TableHead>Hall</TableHead>
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
                          {token.hall ? formatHallLabel(token.hall) : "—"}
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
                      <TableHead>Hall</TableHead>
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
                        <TableCell>
                          {token.hall ? formatHallLabel(token.hall) : "—"}
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
