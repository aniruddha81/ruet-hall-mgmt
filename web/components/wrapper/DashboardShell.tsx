"use client";

import { useLayout } from "@/contexts/LayoutContext";
import Navbar from "../navbar";
import Sidebar from "../sidebar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    isSidebarPinned,
    isSidebarHovered,
    hasHydratedSidebarPin,
    openMobile,
  } = useLayout();

  const isExpanded = isSidebarPinned || isSidebarHovered;
  const mainTransitionClass = hasHydratedSidebarPin
    ? "transition-all duration-300"
    : "transition-none";

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={openMobile} />
      <Sidebar />
      <main
        className={`min-h-screen pt-16 ${mainTransitionClass} ${
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
