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
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import { getApplications } from "@/lib/services/admission.service";
import {
  getTodayMenus,
  getTomorrowMenusList,
} from "@/lib/services/dining.service";
import type { MealMenu, SeatApplication } from "@/lib/types";
import {
  Building,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Loader2,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [todayMenus, setTodayMenus] = useState<MealMenu[]>([]);
  const [tomorrowMenus, setTomorrowMenus] = useState<MealMenu[]>([]);
  const [pendingApplications, setPendingApplications] = useState<
    SeatApplication[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [todayRes, tomorrowRes, appsRes] = await Promise.allSettled([
          getTodayMenus(),
          getTomorrowMenusList(),
          getApplications({ status: "PENDING" }),
        ]);

        if (todayRes.status === "fulfilled")
          setTodayMenus(todayRes.value.data?.data ?? []);
        if (tomorrowRes.status === "fulfilled")
          setTomorrowMenus(tomorrowRes.value.data?.data ?? []);
        if (appsRes.status === "fulfilled")
          setPendingApplications(appsRes.value.data?.data?.applications ?? []);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Welcome, {user?.name} &mdash; {user?.designation?.replace(/_/g, " ")}{" "}
          | {user?.hall?.replace(/_/g, " ")}
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Today Menus
                </p>
                <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">
                  {todayMenus.length}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Tomorrow Menus
                </p>
                <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">
                  {tomorrowMenus.length}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-chart-2/10 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 md:w-6 md:h-6 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Pending Apps
                </p>
                <p className="text-2xl md:text-3xl font-bold text-chart-4 mt-1">
                  {pendingApplications.length}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-chart-4/10 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">Role</p>
                <p className="text-sm md:text-base font-bold text-foreground mt-1">
                  {user?.designation?.replace(/_/g, " ")}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <Building className="w-5 h-5 md:w-6 md:h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Menus */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today&apos;s Menus</CardTitle>
          <Link href="/dashboard/dining">
            <Button variant="outline" size="sm">
              Manage <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {todayMenus.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No menus for today.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meal</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayMenus.map((menu) => (
                  <TableRow key={menu.id}>
                    <TableCell className="font-medium">
                      {menu.mealType?.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {menu.items}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ৳{menu.price}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{menu.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Applications */}
      {pendingApplications.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Seat Applications</CardTitle>
            <Link href="/dashboard/admissions">
              <Button variant="outline" size="sm">
                Review <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApplications.slice(0, 5).map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      {app.studentName ?? `Student #${app.studentId}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {app.academicDepartment}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {app.createdAt
                        ? new Date(app.createdAt).toLocaleDateString("en-GB")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{app.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/dining">
          <Button
            variant="outline"
            className="w-full h-auto p-6 justify-between"
            size="lg"
          >
            <div className="text-left">
              <h4 className="text-lg font-bold">Dining</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Manage menus &amp; tokens
              </p>
            </div>
            <UtensilsCrossed className="w-6 h-6" />
          </Button>
        </Link>

        <Link href="/dashboard/admissions">
          <Button
            variant="outline"
            className="w-full h-auto p-6 justify-between"
            size="lg"
          >
            <div className="text-left">
              <h4 className="text-lg font-bold">Admissions</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Review &amp; allocate seats
              </p>
            </div>
            <ClipboardList className="w-6 h-6" />
          </Button>
        </Link>

        <Link href="/dashboard/inventory">
          <Button
            variant="outline"
            className="w-full h-auto p-6 justify-between"
            size="lg"
          >
            <div className="text-left">
              <h4 className="text-lg font-bold">Inventory</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Rooms, beds &amp; assets
              </p>
            </div>
            <Wrench className="w-6 h-6" />
          </Button>
        </Link>

        <Link href="/dashboard/finance">
          <Button
            variant="outline"
            className="w-full h-auto p-6 justify-between"
            size="lg"
          >
            <div className="text-left">
              <h4 className="text-lg font-bold">Finance</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Dues, payments &amp; expenses
              </p>
            </div>
            <CreditCard className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
