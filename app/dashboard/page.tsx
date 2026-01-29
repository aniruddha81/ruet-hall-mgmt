import DashboardShell from "@/components/wrapper/DashboardShell";
import AdminDashboard from "./Dashboard";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <AdminDashboard />
    </DashboardShell>
  );
}
