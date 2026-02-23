"use client";

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
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import { getMyApplicationStatus } from "@/lib/services/admission.service";
import {
  getMyActiveTokens,
  getTomorrowMenus,
} from "@/lib/services/dining.service";
import type { MealMenu, MealToken } from "@/lib/types";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  ClipboardList,
  Home,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [menus, setMenus] = useState<MealMenu[]>([]);
  const [activeTokens, setActiveTokens] = useState<MealToken[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [menusRes, tokensRes] = await Promise.allSettled([
          getTomorrowMenus(),
          getMyActiveTokens(),
        ]);

        if (menusRes.status === "fulfilled")
          setMenus(menusRes.value.data?.data ?? []);
        if (tokensRes.status === "fulfilled")
          setActiveTokens(tokensRes.value.data?.data ?? []);

        try {
          const appRes = await getMyApplicationStatus();
          setApplicationStatus(appRes.data?.data?.status ?? null);
        } catch {
          // No application => that's fine
        }
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
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
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">
          Welcome, {user?.name ?? "Student"}
        </h2>
        <p className="text-muted-foreground mt-2">
          Roll: {user?.rollNumber} | {user?.academicDepartment} | Session:{" "}
          {user?.session}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Hall</p>
                <p className="text-lg font-bold text-foreground mt-2">
                  {user?.hall?.replace(/_/g, " ") ?? "Not Assigned"}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Tokens</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {activeTokens.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Tomorrow Menus</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {menus.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-chart-4/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Seat App.</p>
                <p className="text-lg font-bold mt-2">
                  {applicationStatus ? (
                    <Badge
                      variant={
                        applicationStatus === "APPROVED"
                          ? "default"
                          : applicationStatus === "REJECTED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {applicationStatus}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tomorrow's Menus */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tomorrow&apos;s Menus</CardTitle>
          <Link href="/dashboard/dining">
            <Button variant="outline" size="sm">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {menus.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No menus available for tomorrow yet.
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
                {menus.map((menu) => (
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

      {/* Active Meal Tokens */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Meal Tokens</CardTitle>
          <Link href="/dashboard/dining">
            <Button variant="outline" size="sm">
              Book Tokens <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {activeTokens.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No active meal tokens. Book one from the dining page.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token ID</TableHead>
                  <TableHead>Meal</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTokens.slice(0, 5).map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="font-mono text-sm">
                      #{token.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {token.mealType?.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {token.menuDate
                        ? new Date(token.menuDate).toLocaleDateString("en-GB")
                        : "-"}
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
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/dashboard/dining">
          <Button
            variant="outline"
            className="w-full h-auto p-6 justify-between"
            size="lg"
          >
            <div className="text-left">
              <h4 className="text-lg font-bold">Dining</h4>
              <p className="text-muted-foreground text-sm mt-1">
                View menus &amp; book meal tokens
              </p>
            </div>
            <UtensilsCrossed className="w-6 h-6" />
          </Button>
        </Link>

        <Link href="/dashboard/admission">
          <Button
            variant="outline"
            className="w-full h-auto p-6 justify-between"
            size="lg"
          >
            <div className="text-left">
              <h4 className="text-lg font-bold">Seat Application</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Apply for hall seat
              </p>
            </div>
            <ClipboardList className="w-6 h-6" />
          </Button>
        </Link>

        <Link href="/dashboard/report-damage">
          <Button
            variant="outline"
            className="w-full h-auto p-6 justify-between"
            size="lg"
          >
            <div className="text-left">
              <h4 className="text-lg font-bold">Report Damage</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Report damaged assets
              </p>
            </div>
            <AlertTriangle className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
