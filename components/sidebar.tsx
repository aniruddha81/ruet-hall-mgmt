"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useLayout } from "@/contexts/LayoutContext";
import type { StaffRole } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import {
  Building,
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
import { useMemo } from "react";

interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: StaffRole[] | "all";
}

const allNavLinks: NavLink[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: "all",
  },
  {
    label: "Dining",
    href: "/dashboard/dining",
    icon: UtensilsCrossed,
    roles: ["DINING_MANAGER", "ASST_DINING"],
  },
  {
    label: "Admissions",
    href: "/dashboard/admissions",
    icon: ClipboardList,
    roles: ["ASST_INVENTORY", "INVENTORY_SECTION_OFFICER"],
  },
  {
    label: "Inventory",
    href: "/dashboard/inventory",
    icon: Building,
    roles: ["ASST_INVENTORY", "INVENTORY_SECTION_OFFICER"],
  },
  {
    label: "Finance",
    href: "/dashboard/finance",
    icon: CreditCard,
    roles: ["ASST_FINANCE", "FINANCE_SECTION_OFFICER"],
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: User,
    roles: "all",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: "all",
  },
];

export default function Sidebar() {
  const {
    isSidebarPinned,
    isSidebarHovered,
    isMobileOpen,
    togglePin,
    setHovered,
    closeMobile,
  } = useLayout();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Sidebar is expanded if pinned OR hovered (on desktop)
  const isExpanded = isSidebarPinned || isSidebarHovered;

  // Filter nav links based on user's role
  // Provost sees everything (bypasses role check)
  const navLinks = useMemo(() => {
    const role = user?.designation;
    if (!role) return allNavLinks.filter((l) => l.roles === "all");
    if (role === "PROVOST") return allNavLinks;
    return allNavLinks.filter(
      (link) => link.roles === "all" || link.roles.includes(role),
    );
  }, [user?.designation]);

  const handleLinkClick = () => {
    // Only close sidebar on mobile when a link is clicked
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      closeMobile();
    }
  };

  return (
    <TooltipProvider>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Sidebar (Drawer) */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300 z-50 md:hidden ${
          isMobileOpen
            ? "translate-x-0 animate-in slide-in-from-left"
            : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full py-4">
          <div className="px-4 mb-6 flex items-center justify-between">
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
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 mt-auto">
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed top-16 left-0 h-[calc(100vh-4rem)] flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 z-30 ${
          isExpanded ? "w-64" : "w-16"
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Pin Button */}
        <div
          className={`px-3 py-4 flex ${isExpanded ? "justify-end" : "justify-center"}`}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePin}
                className="h-8 w-8"
              >
                {isSidebarPinned ? (
                  <PinOff className="h-4 w-4" />
                ) : (
                  <Pin className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isSidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Tooltip key={link.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    } ${!isExpanded ? "justify-center" : ""}`}
                  >
                    <link.icon className="w-5 h-5 shrink-0" />
                    {isExpanded && <span>{link.label}</span>}
                  </Link>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right">{link.label}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="px-3 py-4 mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={logout}
                className={`w-full gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 ${
                  isExpanded ? "justify-start" : "justify-center"
                }`}
              >
                <LogOut className="w-5 h-5 shrink-0" />
                {isExpanded && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right">Logout</TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
