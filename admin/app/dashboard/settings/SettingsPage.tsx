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
  createAcademicSession,
  getAdminApplications,
  getManagedAcademicSessions,
  logoutAll,
  updateAcademicSession,
} from "@/lib/services/auth.service";
import type { AcademicSession, AdminData } from "@/lib/types";
import { CheckCircle, Loader2, LogOut, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const isProvost = user?.designation === "PROVOST";
  const canManageSignupSessions =
    user?.designation === "PROVOST" ||
    user?.designation === "ASST_FINANCE" ||
    user?.designation === "FINANCE_SECTION_OFFICER" ||
    user?.designation === "ASST_INVENTORY" ||
    user?.designation === "INVENTORY_SECTION_OFFICER";

  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Admin applications (Provost only)
  const [applications, setApplications] = useState<AdminData[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>(
    [],
  );
  const [newSessionLabel, setNewSessionLabel] = useState("");
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionProcessingId, setSessionProcessingId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (isProvost) {
      setLoadingApps(true);
      getAdminApplications()
        .then((res) => setApplications(res.data.applications ?? []))
        .catch(() => {})
        .finally(() => setLoadingApps(false));
    }
  }, [isProvost]);

  const fetchAcademicSessions = async () => {
    if (!canManageSignupSessions) return;
    setSessionsLoading(true);
    try {
      const res = await getManagedAcademicSessions();
      setAcademicSessions(res.data.sessions ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAcademicSessions();
  }, [canManageSignupSessions]);

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

  const handleCreateAcademicSession = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newSessionLabel.trim()) return;

    setSessionProcessingId("new");
    setError(null);
    try {
      await createAcademicSession({ label: newSessionLabel.trim() });
      setNewSessionLabel("");
      setSuccess("Academic session created successfully.");
      await fetchAcademicSessions();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSessionProcessingId(null);
    }
  };

  const handleToggleAcademicSession = async (session: AcademicSession) => {
    setSessionProcessingId(session.id);
    setError(null);
    try {
      await updateAcademicSession(session.id, { isActive: !session.isActive });
      setSuccess("Academic session updated successfully.");
      await fetchAcademicSessions();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSessionProcessingId(null);
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

      {canManageSignupSessions && (
        <Card>
          <CardHeader>
            <CardTitle>Signup Session Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Student signup session options are controlled here. Dining
              managers cannot manage this list.
            </p>

            <form onSubmit={handleCreateAcademicSession} className="flex gap-2">
              <input
                value={newSessionLabel}
                onChange={(event) => setNewSessionLabel(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g. 2022-23"
                required
              />
              <Button type="submit" disabled={sessionProcessingId === "new"}>
                {sessionProcessingId === "new" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add
              </Button>
            </form>

            {sessionsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : academicSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No session options found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {academicSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {session.label}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={session.isActive ? "default" : "secondary"}
                        >
                          {session.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={sessionProcessingId === session.id}
                          onClick={() => handleToggleAcademicSession(session)}
                        >
                          {session.isActive ? "Deactivate" : "Activate"}
                        </Button>
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
