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
  createTomorrowMenu,
  deleteTomorrowMenu,
  getTodayMenus,
  getTomorrowBookings,
  getTomorrowMenusList,
  markTokensAsConsumed,
} from "@/lib/services/dining.service";
import type { MealMenu, MealToken, MealType } from "@/lib/types";
import { MEAL_TYPES } from "@/lib/types";
import { Loader2, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";

export default function DiningManagement() {
  const [todayMenus, setTodayMenus] = useState<MealMenu[]>([]);
  const [tomorrowMenus, setTomorrowMenus] = useState<MealMenu[]>([]);
  const [bookings, setBookings] = useState<MealToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New menu form
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [menuForm, setMenuForm] = useState({
    mealType: "" as MealType | "",
    menuDescription: "",
    price: "",
    totalTokens: "",
  });

  const fetchData = async () => {
    try {
      const [todayRes, tomorrowRes, bookingsRes] = await Promise.allSettled([
        getTodayMenus(),
        getTomorrowMenusList(),
        getTomorrowBookings(),
      ]);
      if (todayRes.status === "fulfilled")
        setTodayMenus(todayRes.value.data?.menus ?? []);
      if (tomorrowRes.status === "fulfilled")
        setTomorrowMenus(tomorrowRes.value.data?.menus ?? []);
      if (bookingsRes.status === "fulfilled")
        setBookings(bookingsRes.value.data?.bookings ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.mealType) return;
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      await createTomorrowMenu({
        mealType: menuForm.mealType as MealType,
        menuDescription: menuForm.menuDescription,
        price: Number(menuForm.price),
        totalTokens: Number(menuForm.totalTokens),
      });
      setSuccess("Menu created successfully!");
      setShowForm(false);
      setMenuForm({
        mealType: "",
        menuDescription: "",
        price: "",
        totalTokens: "",
      });
      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    setError(null);
    try {
      await deleteTomorrowMenu(menuId);
      setSuccess("Menu deleted.");
      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleMarkConsumed = async (tokenIds: string[]) => {
    setError(null);
    try {
      await markTokensAsConsumed({ tokenIds });
      setSuccess("Tokens marked as consumed.");
      await fetchData();
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <UtensilsCrossed className="h-8 w-8" />
            Dining Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Create menus, manage tokens, and view bookings
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          New Menu
        </Button>
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

      {/* Create Menu Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Tomorrow&apos;s Menu</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMenu} className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="mealType">Meal Type</Label>
                <select
                  id="mealType"
                  value={menuForm.mealType}
                  onChange={(e) =>
                    setMenuForm({
                      ...menuForm,
                      mealType: e.target.value as MealType,
                    })
                  }
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select meal type</option>
                  {MEAL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="menuDescription">Menu Description</Label>
                <Input
                  id="menuDescription"
                  value={menuForm.menuDescription}
                  onChange={(e) =>
                    setMenuForm({
                      ...menuForm,
                      menuDescription: e.target.value,
                    })
                  }
                  placeholder="Rice, Dal, Chicken Curry..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (৳)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={menuForm.price}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, price: e.target.value })
                    }
                    placeholder="50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalTokens">Total Tokens</Label>
                  <Input
                    id="totalTokens"
                    type="number"
                    value={menuForm.totalTokens}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, totalTokens: e.target.value })
                    }
                    placeholder="100"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Create Menu
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="tomorrow">
        <TabsList>
          <TabsTrigger value="tomorrow">
            Tomorrow ({tomorrowMenus.length})
          </TabsTrigger>
          <TabsTrigger value="today">Today ({todayMenus.length})</TabsTrigger>
          <TabsTrigger value="bookings">
            Bookings ({bookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tomorrow" className="mt-6">
          {tomorrowMenus.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No menus created for tomorrow yet.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meal</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tomorrowMenus.map((menu) => (
                      <TableRow key={menu.id}>
                        <TableCell className="font-medium">
                          {menu.mealType?.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {menu.menuDescription}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ৳{menu.price}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {menu.bookedTokens}/{menu.totalTokens}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteMenu(menu.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

        <TabsContent value="today" className="mt-6">
          {todayMenus.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No menus for today.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meal</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Tokens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayMenus.map((menu) => (
                      <TableRow key={menu.id}>
                        <TableCell className="font-medium">
                          {menu.mealType?.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {menu.menuDescription}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ৳{menu.price}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {menu.bookedTokens}/{menu.totalTokens}
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

        <TabsContent value="bookings" className="mt-6">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No bookings for tomorrow.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-end mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const activeIds = bookings
                        .filter((t) => t.status === "ACTIVE")
                        .map((t) => t.id);
                      if (activeIds.length > 0) handleMarkConsumed(activeIds);
                    }}
                  >
                    Mark All as Consumed
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token #</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell className="font-mono text-xs">
                          #{token.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium">
                          Student #{token.studentId.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          {token.mealType?.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              token.status === "CONSUMED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {token.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {token.status === "ACTIVE" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkConsumed([token.id])}
                            >
                              Mark Consumed
                            </Button>
                          )}
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
