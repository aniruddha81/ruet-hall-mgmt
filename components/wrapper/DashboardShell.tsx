"use client";

import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { useLayout } from "@/contexts/LayoutContext";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { isSidebarPinned, toggleMobile } = useLayout();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={toggleMobile} />
      <Sidebar />
      <main
        className={`transition-all duration-300 pt-4 px-4 md:px-6 lg:px-8 pb-8 ${
          isSidebarPinned ? "md:ml-64" : "md:ml-16"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
