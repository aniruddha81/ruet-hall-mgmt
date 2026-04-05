"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLayout } from "@/contexts/LayoutContext";
import {
  AlertTriangle,
  ClipboardList,
  CreditCard,
  Home,
  LogOut,
  Pin,
  PinOff,
  Settings,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const {
    isSidebarPinned,
    isSidebarHovered,
    isMobileOpen,
    hasHydratedSidebarPin,
    togglePin,
    setHovered,
    closeMobile,
  } = useLayout();
  const pathname = usePathname();
  const { logout } = useAuth();

  const isExpanded = isSidebarPinned || isSidebarHovered;
  const desktopTransitionClass = hasHydratedSidebarPin
    ? "transition-[width] duration-300 ease-out"
    : "transition-none";
  const desktopLabelTransitionClass = hasHydratedSidebarPin
    ? "transition-[max-width,opacity,margin,transform] duration-300 ease-out"
    : "transition-none";
  const desktopLabelClass = `min-w-0 overflow-hidden whitespace-nowrap text-left ${desktopLabelTransitionClass} ${
    isExpanded
      ? "ml-1 max-w-[160px] translate-x-0 opacity-100"
      : "ml-0 max-w-0 -translate-x-1 opacity-0"
  }`;

  const navLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "Dining",
      href: "/dashboard/dining",
      icon: UtensilsCrossed,
    },
    {
      label: "Admission",
      href: "/dashboard/admission",
      icon: ClipboardList,
    },
    {
      label: "Report Damage",
      href: "/dashboard/report-damage",
      icon: AlertTriangle,
    },
    {
      label: "Payments",
      href: "/dashboard/payments",
      icon: CreditCard,
    },
    {
      label: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      closeMobile();
    }
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-in fade-in md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-72 border-r border-sidebar-border bg-sidebar transition-transform duration-300 md:hidden ${
          isMobileOpen
            ? "translate-x-0 animate-in slide-in-from-left"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col py-4">
          <div className="mb-6 flex items-center justify-between px-4">
            <span className="font-semibold text-sidebar-foreground">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMobile}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  } justify-start px-1`}
                  onClick={handleLinkClick}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <aside
        className={`fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] overflow-hidden border-r border-sidebar-border bg-sidebar ${desktopTransitionClass} md:block ${
          isExpanded ? "w-64" : "w-16"
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex h-full flex-col py-4">
          <div className="mb-4 flex justify-end px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePin}
              className="h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {isSidebarPinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </Button>
          </div>

          <nav className="flex-1 space-y-1 px-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex h-11 items-center rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  } justify-start px-1`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                    <Icon className="h-5 w-5 shrink-0" />
                  </span>
                  <span className={desktopLabelClass}>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border px-2 pt-4">
            <Button
              variant="ghost"
              onClick={logout}
              className="flex h-11 w-full items-center justify-start overflow-hidden px-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                <LogOut className="h-5 w-5 shrink-0" />
              </span>
              <span className={desktopLabelClass}>Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
