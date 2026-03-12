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
import type { MealMenu, SeatApplication, StaffRole } from "@/lib/types";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Loader2,
  ShieldCheck,
  TrendingUp,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const DINING_ROLES: StaffRole[] = ["DINING_MANAGER", "ASST_DINING"];
const ADMISSION_ROLES: StaffRole[] = [
  "ASST_INVENTORY",
  "INVENTORY_SECTION_OFFICER",
];
const INVENTORY_ROLES: StaffRole[] = [
  "ASST_INVENTORY",
  "INVENTORY_SECTION_OFFICER",
];
const FINANCE_ROLES: StaffRole[] = ["ASST_FINANCE", "FINANCE_SECTION_OFFICER"];

function hasAccess(designation: string | undefined, roles: StaffRole[]) {
  if (!designation) return false;
  if (designation === "PROVOST") return true;
  return roles.includes(designation as StaffRole);
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [todayMenus, setTodayMenus] = useState<MealMenu[]>([]);
  const [tomorrowMenus, setTomorrowMenus] = useState<MealMenu[]>([]);
  const [pendingApplications, setPendingApplications] = useState<
    SeatApplication[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canDining = useMemo(
    () => hasAccess(user?.designation, DINING_ROLES),
    [user?.designation],
  );
  const canAdmissions = useMemo(
    () => hasAccess(user?.designation, ADMISSION_ROLES),
    [user?.designation],
  );
  const canInventory = useMemo(
    () => hasAccess(user?.designation, INVENTORY_ROLES),
    [user?.designation],
  );
  const canFinance = useMemo(
    () => hasAccess(user?.designation, FINANCE_ROLES),
    [user?.designation],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises: Promise<unknown>[] = [];
        const keys: string[] = [];

        if (canDining) {
          promises.push(getTodayMenus(), getTomorrowMenusList());
          keys.push("today", "tomorrow");
        }
        if (canAdmissions) {
          promises.push(getApplications({ status: "PENDING" }));
          keys.push("apps");
        }

        if (promises.length === 0) {
          setLoading(false);
          return;
        }

        const results = await Promise.allSettled(promises);

        let idx = 0;
        for (const key of keys) {
          const res = results[idx];
          if (res?.status === "fulfilled") {
            const val = res.value as { data?: Record<string, unknown> };
            if (key === "today")
              setTodayMenus((val.data?.menus as MealMenu[]) ?? []);
            else if (key === "tomorrow")
              setTomorrowMenus((val.data?.menus as MealMenu[]) ?? []);
            else if (key === "apps")
              setPendingApplications(
                (val.data?.applications as SeatApplication[]) ?? [],
              );
          }
          idx++;
        }
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [canDining, canAdmissions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading dashboard data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-sky-900 to-cyan-900 px-6 py-7 text-white shadow-xl md:px-10 md:py-9">
        <div className="pointer-events-none absolute inset-0 opacity-15 [background:linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.22)_50%,transparent_100%)] [background-size:250%_250%] [animation:shine_12s_linear_infinite]" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/50 bg-emerald-300/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            System Online
          </div>
          <h2 className="text-2xl font-bold md:text-3xl">
            Welcome,{" "}
            <span className="text-cyan-200">{user?.name ?? "Administrator"}</span>
          </h2>
          <p className="text-sm text-cyan-100/80">
            {user?.designation?.replace(/_/g, " ")} &mdash;{" "}
            {user?.hall?.replace(/_/g, " ")}
          </p>
        </div>
        <style jsx>{`
          @keyframes shine {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }
        `}</style>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
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
                      {menu.menuDescription}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ৳{menu.price}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{menu.availableTokens}</Badge>
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
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                Review All <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Applied</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApplications.slice(0, 5).map((app) => (
                  <TableRow key={app.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {app.studentName ?? `Student #${app.studentId}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {app.academicDepartment}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {app.createdAt
                        ? new Date(app.createdAt).toLocaleDateString("en-GB")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        {app.status}
                      </Badge>
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
