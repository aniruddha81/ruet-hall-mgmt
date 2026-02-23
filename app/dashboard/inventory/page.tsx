import DashboardShell from "@/components/wrapper/DashboardShell";
import InventoryManagement from "./InventoryManagement";

export default function Page() {
  return (
    <DashboardShell>
      <InventoryManagement />
    </DashboardShell>
  );
}
