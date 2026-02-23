"use client";

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
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import {
  bookMealTokens,
  cancelMealToken,
  getMyActiveTokens,
  getMyTokenHistory,
  getTomorrowMenus,
} from "@/lib/services/dining.service";
import type { MealMenu, MealToken } from "@/lib/types";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";

export default function DiningPage() {
  const { user } = useAuth();
  const [menus, setMenus] = useState<MealMenu[]>([]);
  const [activeTokens, setActiveTokens] = useState<MealToken[]>([]);
  const [history, setHistory] = useState<MealToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingMenuId, setBookingMenuId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [menusRes, tokensRes, historyRes] = await Promise.allSettled([
        getTomorrowMenus(user?.hall ?? "ZIA_HALL"),
        getMyActiveTokens(),
        getMyTokenHistory(),
      ]);
      if (menusRes.status === "fulfilled")
        setMenus(menusRes.value.data?.menus ?? []);
      if (tokensRes.status === "fulfilled")
        setActiveTokens(tokensRes.value.data?.tokens ?? []);
      if (historyRes.status === "fulfilled")
        setHistory(historyRes.value.data?.tokens ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBook = async (menuId: string) => {
    setBookingMenuId(menuId);
    setError(null);
    setSuccess(null);
    try {
      await bookMealTokens({ menuId, quantity: 1 });
      setSuccess("Meal token booked successfully!");
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
      setSuccess("Token cancelled successfully!");
      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCancellingId(null);
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
          <UtensilsCrossed className="h-8 w-8" />
          Dining
        </h2>
        <p className="text-muted-foreground mt-1">
          View menus, book meal tokens, and manage your dining
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

      <Tabs defaultValue="menus">
        <TabsList>
          <TabsTrigger value="menus">Tomorrow&apos;s Menus</TabsTrigger>
          <TabsTrigger value="active">
            Active Tokens ({activeTokens.length})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="menus" className="mt-6">
          {menus.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No menus available for tomorrow yet. Check back later.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menus.map((menu) => (
                <Card
                  key={menu.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {menu.mealType?.replace(/_/g, " ")}
                      </CardTitle>
                      <Badge variant="outline">
                        {menu.availableTokens}/{menu.totalTokens} left
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm">
                      {menu.menuDescription}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">৳{menu.price}</span>
                      <Button
                        onClick={() => handleBook(menu.id)}
                        disabled={
                          bookingMenuId === menu.id || menu.availableTokens <= 0
                        }
                        size="sm"
                      >
                        {bookingMenuId === menu.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Book Token
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                      <TableHead>Token #</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTokens.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell className="font-mono text-xs">
                          #{token.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {token.mealType?.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {token.mealDate
                            ? new Date(token.mealDate).toLocaleDateString(
                                "en-GB",
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>{token.quantity}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{token.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(token.id)}
                            disabled={cancellingId === token.id}
                          >
                            {cancellingId === token.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
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
                      <TableHead>Token #</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Date</TableHead>
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
                          {token.mealType?.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {token.mealDate
                            ? new Date(token.mealDate).toLocaleDateString(
                                "en-GB",
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ৳{token.totalAmount}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              token.status === "CONSUMED"
                                ? "default"
                                : token.status === "CANCELLED"
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
    </div>
  );
}
