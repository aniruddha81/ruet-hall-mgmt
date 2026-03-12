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
          setTodayMenus(todayRes.value.data?.menus ?? []);
        if (tomorrowRes.status === "fulfilled")
          setTomorrowMenus(tomorrowRes.value.data?.menus ?? []);
        if (appsRes.status === "fulfilled")
          setPendingApplications(appsRes.value.data?.applications ?? []);
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

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {[
          {
            label: "Today's Menus",
            value: todayMenus.length,
            sub: "Active meal plans",
            icon: UtensilsCrossed,
            accent: "from-sky-500 to-cyan-500",
            light: "bg-sky-50",
            text: "text-sky-600",
          },
          {
            label: "Tomorrow's Menus",
            value: tomorrowMenus.length,
            sub: "Scheduled meal plans",
            icon: UtensilsCrossed,
            accent: "from-violet-500 to-purple-500",
            light: "bg-violet-50",
            text: "text-violet-600",
          },
          {
            label: "Pending Apps",
            value: pendingApplications.length,
            sub: "Awaiting your review",
            icon: ClipboardList,
            accent: "from-amber-500 to-orange-500",
            light: "bg-amber-50",
            text: "text-amber-600",
          },
          {
            label: "Your Role",
            value: null,
            sub: user?.designation?.replace(/_/g, " ") ?? "—",
            icon: ShieldCheck,
            accent: "from-emerald-500 to-teal-500",
            light: "bg-emerald-50",
            text: "text-emerald-600",
          },
        ].map(({ label, value, sub, icon: Icon, accent, light, text }) => (
          <Card
            key={label}
            className="group relative overflow-hidden border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div
              className={`pointer-events-none absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${accent}`}
            />
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-muted-foreground md:text-sm">
                    {label}
                  </p>
                  {value !== null ? (
                    <p className={`mt-1 text-2xl font-bold md:text-3xl ${text}`}>
                      {value}
                    </p>
                  ) : (
                    <p className={`mt-1 text-sm font-bold md:text-base ${text}`}>
                      {sub}
                    </p>
                  )}
                  {value !== null && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {sub}
                    </p>
                  )}
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${light} md:h-12 md:w-12`}
                >
                  <Icon className={`h-5 w-5 md:h-6 md:w-6 ${text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Today's Menus ── */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
              <UtensilsCrossed className="h-4 w-4 text-sky-600" />
            </div>
            <CardTitle className="text-base font-semibold">Today&apos;s Menus</CardTitle>
          </div>
          <Link href="/dashboard/dining">
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              Manage <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {todayMenus.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <UtensilsCrossed className="h-8 w-8 opacity-30" />
              <p className="text-sm">No menus scheduled for today.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold">Meal Type</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Price</TableHead>
                  <TableHead className="font-semibold">Tokens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayMenus.map((menu) => (
                  <TableRow key={menu.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {menu.mealType?.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {menu.menuDescription}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-emerald-600">
                        ৳{menu.price}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">
                        {menu.availableTokens}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Pending Applications ── */}
      {pendingApplications.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <ClipboardList className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Pending Seat Applications
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {pendingApplications.length} application
                  {pendingApplications.length !== 1 ? "s" : ""} awaiting review
                </p>
              </div>
            </div>
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

      {/* ── Quick Actions ── */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "/dashboard/dining",
              title: "Dining",
              desc: "Manage menus & tokens",
              icon: UtensilsCrossed,
              accent: "from-sky-500 to-cyan-500",
              light: "bg-sky-50 group-hover:bg-sky-100",
              text: "text-sky-600",
            },
            {
              href: "/dashboard/admissions",
              title: "Admissions",
              desc: "Review & allocate seats",
              icon: ClipboardList,
              accent: "from-amber-500 to-orange-500",
              light: "bg-amber-50 group-hover:bg-amber-100",
              text: "text-amber-600",
            },
            {
              href: "/dashboard/inventory",
              title: "Inventory",
              desc: "Rooms, beds & assets",
              icon: Wrench,
              accent: "from-violet-500 to-purple-500",
              light: "bg-violet-50 group-hover:bg-violet-100",
              text: "text-violet-600",
            },
            {
              href: "/dashboard/finance",
              title: "Finance",
              desc: "Dues, payments & expenses",
              icon: CreditCard,
              accent: "from-emerald-500 to-teal-500",
              light: "bg-emerald-50 group-hover:bg-emerald-100",
              text: "text-emerald-600",
            },
          ].map(({ href, title, desc, icon: Icon, accent, light, text }) => (
            <Link key={href} href={href} className="group block">
              <Card className="h-full cursor-pointer border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <div
                  className={`h-1 w-full rounded-t-xl bg-gradient-to-r ${accent}`}
                />
                <CardContent className="flex items-center justify-between p-5">
                  <div className="space-y-0.5">
                    <h4 className="text-base font-bold text-foreground">
                      {title}
                    </h4>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${light}`}
                    >
                      <Icon className={`h-5 w-5 ${text}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
