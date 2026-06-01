"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { clearAuthData } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import {
  deleteStudentAccount,
  logoutAll,
} from "@/lib/services/auth.service";
import { CheckCircle, Loader2, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DELETE_CONFIRM_PHRASE = "DELETE";

export default function SettingsPage() {
  const { logout } = useAuth();
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== DELETE_CONFIRM_PHRASE) {
      setError(`Type ${DELETE_CONFIRM_PHRASE} to confirm account deletion`);
      return;
    }
    if (!deletePassword) {
      setError("Enter your password to delete your account");
      return;
    }

    setDeletingAccount(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteStudentAccount({ password: deletePassword });
      clearAuthData();
      setSuccess("Your account has been deleted");
      setTimeout(() => {
        window.location.href = "/signup";
      }, 1200);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeletingAccount(false);
    }
  };

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

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
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
            If you suspect unauthorized access, you can log out from all devices
            at once.
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

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Delete Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Permanently delete your student account and all related data,
            including seat applications, meal records, payments, and damage
            reports. This cannot be undone.
          </p>
          <div className="space-y-2">
            <Label htmlFor="delete-password">Password</Label>
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              disabled={deletingAccount}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              Type <span className="font-mono">{DELETE_CONFIRM_PHRASE}</span> to
              confirm
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={deletingAccount}
              placeholder={DELETE_CONFIRM_PHRASE}
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={
              deletingAccount ||
              deleteConfirmText !== DELETE_CONFIRM_PHRASE ||
              !deletePassword
            }
          >
            {deletingAccount ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete My Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
