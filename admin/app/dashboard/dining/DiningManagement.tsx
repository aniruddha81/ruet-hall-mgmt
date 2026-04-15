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
  createMealItem,
  createTomorrowMenu,
  deleteMealItem,
  deleteTomorrowMenu,
  getDateRangeSalesReport,
  getMealItems,
  getTodayMenus,
  getTomorrowBookings,
  getTomorrowMenusList,
  markTokensAsConsumed,
  updateMealItem,
} from "@/lib/services/dining.service";
import type {
  DiningDateRangeSalesReport,
  MealItem,
  MealMenu,
  MealToken,
  MealType,
} from "@/lib/types";
import { MEAL_TYPES } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Loader2, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function DiningManagement() {
  const [todayMenus, setTodayMenus] = useState<MealMenu[]>([]);
  const [tomorrowMenus, setTomorrowMenus] = useState<MealMenu[]>([]);
  const [bookings, setBookings] = useState<MealToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [reportRange, setReportRange] = useState(() => {
    const today = formatDateInput(new Date());
    return {
      startDate: today,
      endDate: today,
    };
  });

  // New menu form
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [newMealItemName, setNewMealItemName] = useState("");
  const [creatingMealItem, setCreatingMealItem] = useState(false);
  const [updatingMealItemId, setUpdatingMealItemId] = useState<string | null>(
    null,
  );
  const [menuForm, setMenuForm] = useState({
    mealType: "" as MealType | "",
    mealItemIds: [] as string[],
    price: "",
    totalTokens: "",
  });

  const fetchData = async () => {
    try {
      const [todayRes, tomorrowRes, bookingsRes, mealItemsRes] =
        await Promise.allSettled([
          getTodayMenus(),
          getTomorrowMenusList(),
          getTomorrowBookings(),
          getMealItems(),
        ]);
      if (todayRes.status === "fulfilled")
        setTodayMenus(todayRes.value.data?.menus ?? []);
      if (tomorrowRes.status === "fulfilled")
        setTomorrowMenus(tomorrowRes.value.data?.menus ?? []);
      if (bookingsRes.status === "fulfilled")
        setBookings(bookingsRes.value.data?.bookings ?? []);
      if (mealItemsRes.status === "fulfilled")
        setMealItems(mealItemsRes.value.data.items ?? []);
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
    if (menuForm.mealItemIds.length === 0) {
      setError("Please select at least one meal item for the menu.");
      return;
    }
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      await createTomorrowMenu({
        mealType: menuForm.mealType as MealType,
        mealItemIds: menuForm.mealItemIds,
        price: Number(menuForm.price),
        totalTokens: Number(menuForm.totalTokens),
      });
      setSuccess("Menu created successfully!");
      setShowForm(false);
      setMenuForm({
        mealType: "",
        mealItemIds: [],
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

  const handleCreateMealItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealItemName.trim()) return;

    setCreatingMealItem(true);
    setError(null);
    setSuccess(null);
    try {
      await createMealItem({ name: newMealItemName.trim() });
      setNewMealItemName("");
      setSuccess("Meal item added successfully.");
      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreatingMealItem(false);
    }
  };

  const handleToggleMealItem = async (item: MealItem) => {
    setUpdatingMealItemId(item.id);
    setError(null);
    setSuccess(null);
    try {
      await updateMealItem(item.id, { isActive: item.isActive !== 1 });
      setSuccess("Meal item updated.");
      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUpdatingMealItemId(null);
    }
  };

  const handleDeleteMealItem = async (itemId: string) => {
    setUpdatingMealItemId(itemId);
    setError(null);
    setSuccess(null);
    try {
      await deleteMealItem(itemId);
      setSuccess("Meal item deleted.");
      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUpdatingMealItemId(null);
    }
  };

  const handleGenerateDateRangePdf = async () => {
    setError(null);
    setSuccess(null);

    const { startDate, endDate } = reportRange;
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    if (startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    const rangeInDays =
      Math.floor(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (24 * 60 * 60 * 1000),
      ) + 1;

    if (rangeInDays > 366) {
      setError("Please select a range of 366 days or fewer.");
      return;
    }

    setGeneratingPdf(true);
    try {
      const reportResponse = await getDateRangeSalesReport(startDate, endDate);
      const report = reportResponse.data as DiningDateRangeSalesReport;
      const reports = report.days ?? [];

      const rows = reports.map((report) => [
        report.date,
        Number(report.lunchTokens ?? 0),
        Number(report.lunchRevenue ?? 0),
        Number(report.dinnerTokens ?? 0),
        Number(report.dinnerRevenue ?? 0),
        Number(report.totalTokensSold ?? 0),
        Number(report.totalRevenue ?? 0),
        Number(report.totalCancellations ?? 0),
      ]);

      const totalTokens = Number(report.summary?.totalTokensSold ?? 0);
      const totalRevenue = Number(report.summary?.totalRevenue ?? 0);
      const totalCancellations = Number(
        report.summary?.totalCancellations ?? 0,
      );

      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text("Dining Date Range Report", 14, 14);
      doc.setFontSize(10);
      doc.text(`Range: ${startDate} to ${endDate}`, 14, 20);

      autoTable(doc, {
        startY: 26,
        head: [
          [
            "Date",
            "Lunch Tokens",
            "Lunch Revenue (BDT)",
            "Dinner Tokens",
            "Dinner Revenue (BDT)",
            "Total Tokens",
            "Total Revenue (BDT)",
            "Cancellations",
          ],
        ],
        body: rows,
        styles: {
          fontSize: 9,
        },
        headStyles: {
          fillColor: [35, 35, 35],
        },
      });

      const summaryY =
        ((doc as unknown as { lastAutoTable?: { finalY: number } })
          .lastAutoTable?.finalY ?? 26) + 10;

      doc.setFontSize(10);
      doc.text(
        `Summary: Total Tokens ${totalTokens} | Total Revenue ${totalRevenue} BDT | Total Cancellations ${totalCancellations}`,
        14,
        summaryY,
      );

      doc.save(`dining-report-${startDate}-to-${endDate}.pdf`);
      setSuccess("Date-range dining report PDF generated successfully.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setGeneratingPdf(false);
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

      <Card>
        <CardHeader>
          <CardTitle>Date-Range PDF Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <Label htmlFor="reportStartDate">Start Date</Label>
              <Input
                id="reportStartDate"
                type="date"
                value={reportRange.startDate}
                onChange={(e) =>
                  setReportRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                max={reportRange.endDate || undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportEndDate">End Date</Label>
              <Input
                id="reportEndDate"
                type="date"
                value={reportRange.endDate}
                onChange={(e) =>
                  setReportRange((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                min={reportRange.startDate || undefined}
              />
            </div>
            <Button
              onClick={handleGenerateDateRangePdf}
              disabled={generatingPdf}
            >
              {generatingPdf && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Generate PDF
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Select a date range to export hall-wise dining report data in PDF
            format.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meal Items Table</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCreateMealItem} className="flex gap-2">
            <Input
              value={newMealItemName}
              onChange={(e) => setNewMealItemName(e.target.value)}
              placeholder="e.g. Rice, Dal, Chicken Curry"
              required
            />
            <Button type="submit" disabled={creatingMealItem}>
              {creatingMealItem && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Add Item
            </Button>
          </form>

          {mealItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No meal items yet. Add items first, then create menus from them.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mealItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.isActive === 1 ? "default" : "secondary"}
                      >
                        {item.isActive === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingMealItemId === item.id}
                        onClick={() => handleToggleMealItem(item)}
                      >
                        {item.isActive === 1 ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={updatingMealItemId === item.id}
                        onClick={() => handleDeleteMealItem(item.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
                <Label>Meal Items (Combination)</Label>
                <div className="space-y-2 rounded-md border border-input p-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMenuForm((prev) => ({
                          ...prev,
                          mealItemIds: mealItems
                            .filter((item) => item.isActive === 1)
                            .map((item) => item.id),
                        }))
                      }
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMenuForm((prev) => ({
                          ...prev,
                          mealItemIds: [],
                        }))
                      }
                    >
                      Clear
                    </Button>
                  </div>

                  <div className="max-h-40 space-y-2 overflow-y-auto">
                    {mealItems.filter((item) => item.isActive === 1).length ===
                    0 ? (
                      <p className="text-sm text-muted-foreground">
                        No active meal items available.
                      </p>
                    ) : (
                      mealItems
                        .filter((item) => item.isActive === 1)
                        .map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={menuForm.mealItemIds.includes(item.id)}
                              onChange={(event) =>
                                setMenuForm((prev) => ({
                                  ...prev,
                                  mealItemIds: event.target.checked
                                    ? [...prev.mealItemIds, item.id]
                                    : prev.mealItemIds.filter(
                                        (id) => id !== item.id,
                                      ),
                                }))
                              }
                            />
                            {item.name}
                          </label>
                        ))
                    )}
                  </div>
                </div>
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
