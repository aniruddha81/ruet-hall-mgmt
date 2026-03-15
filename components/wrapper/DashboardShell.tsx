"use client";

import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { useLayout } from "@/contexts/LayoutContext";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { isSidebarPinned, isSidebarHovered, openMobile } = useLayout();

  const isExpanded = isSidebarPinned || isSidebarHovered;

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={openMobile} />
      <Sidebar />
      <main
        className={`min-h-screen pt-16 transition-all duration-300 ${
          isExpanded ? "md:pl-64" : "md:pl-16"
        }`}
      >
        <div className="mx-auto max-w-7xl p-4 pb-24 md:p-8 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
