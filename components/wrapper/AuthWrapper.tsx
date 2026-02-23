"use client";

import StudentDashboard from "@/app/dashboard/Dashboard";
import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "../home/LandingPage";
import DashboardShell from "./DashboardShell";

export default function AuthWrapper() {
  const { user } = useAuth();

  if (user) {
    return (
      <DashboardShell>
        <StudentDashboard />
      </DashboardShell>
    );
  }

  return <LandingPage />;
}
