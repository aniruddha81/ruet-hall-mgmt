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
import {
  approveAdmin,
  getAdminApplications,
  logoutAll,
} from "@/lib/services/auth.service";
import type { AdminData } from "@/lib/types";
import { CheckCircle, Loader2, LogOut, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const isProvost = user?.designation === "PROVOST";

  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Admin applications (Provost only)
  const [applications, setApplications] = useState<AdminData[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isProvost) {
      setLoadingApps(true);
      getAdminApplications()
        .then((res) => setApplications(res.data.applications ?? []))
        .catch(() => {})
        .finally(() => setLoadingApps(false));
    }
  }, [isProvost]);

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    setError(null);
    try {
      await logoutAll();
      setSuccess("Logged out from all devices");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoggingOutAll(false);
    }
  };

  const handleApproval = async (adminId: string, status: string) => {
    setProcessingId(adminId);
    setError(null);
    try {
      await approveAdmin(adminId, status);
      setApplications((prev) => prev.filter((a) => a.id !== adminId));
      setSuccess(`Admin ${status.toLowerCase()} successfully`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your account and system settings
        </p>
      </div>

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manage your active sessions across devices.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout (This Device)
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutAll}
              disabled={loggingOutAll}
            >
              {loggingOutAll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Logout All Devices
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Applications - Provost Only */}
      {isProvost && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Pending Admin Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingApps ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : applications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No pending admin applications.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.name}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {app.designation?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.operationalUnit}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproval(app.id, "APPROVED")}
                            disabled={processingId === app.id}
                          >
                            {processingId === app.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApproval(app.id, "REJECTED")}
                            disabled={processingId === app.id}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To update your personal details or change your password, visit the{" "}
            <a
              href="/dashboard/profile"
              className="text-primary hover:underline font-medium"
            >
              Profile page
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
