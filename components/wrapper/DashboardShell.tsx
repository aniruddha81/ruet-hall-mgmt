"use client";

import { useLayout } from "@/contexts/LayoutContext";
import Navbar from "../navbar";
import Sidebar from "../sidebar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarPinned, isSidebarHovered, openMobile } = useLayout();

  // Sidebar is expanded if pinned OR hovered (on desktop)
  const isExpanded = isSidebarPinned || isSidebarHovered;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar onMenuClick={openMobile} showMenuOnDesktop={false} />
      <Sidebar />
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          isExpanded ? "md:pl-64" : "md:pl-16"
        }`}
      >
        <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
