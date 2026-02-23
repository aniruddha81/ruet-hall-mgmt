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
import {
  ClipboardList,
  CreditCard,
  HelpCircle,
  Home,
  LogOut,
  Pin,
  PinOff,
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
    togglePin,
    setHovered,
    closeMobile,
  } = useLayout();
  const pathname = usePathname();
  const { logout } = useAuth();

  // Sidebar is expanded if pinned OR hovered (on desktop)
  const isExpanded = isSidebarPinned || isSidebarHovered;

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
      label: "Payments",
      href: "/dashboard#payments",
      icon: CreditCard,
    },
    {
      label: "Support",
      href: "/support",
      icon: HelpCircle,
    },
  ];

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
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                  onClick={handleLinkClick}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar (Always visible, collapsible) */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 hidden md:block ${
          isExpanded ? "w-64" : "w-16"
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex flex-col h-full py-4">
          {/* Pin/Unpin Button */}
          <div
            className={`px-2 mb-4 ${isExpanded ? "flex justify-end" : "flex justify-center"}`}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePin}
                  className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  {isSidebarPinned ? (
                    <PinOff className="h-4 w-4" />
                  ) : (
                    <Pin className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isSidebarPinned ? "Unpin sidebar" : "Pin sidebar open"}
              </TooltipContent>
            </Tooltip>
          </div>

          <nav className="flex-1 space-y-1 px-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={link.href}
                      className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      } ${!isExpanded && "justify-center"}`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {isExpanded && (
                        <span className="whitespace-nowrap overflow-hidden">
                          {link.label}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {!isExpanded && (
                    <TooltipContent side="right">{link.label}</TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>

          <div className="px-2 border-t border-sidebar-border pt-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className={`w-full text-destructive hover:text-destructive hover:bg-destructive/10 ${
                    !isExpanded ? "justify-center px-3" : "justify-start"
                  }`}
                >
                  <LogOut
                    className={`h-5 w-5 shrink-0 ${isExpanded && "mr-3"}`}
                  />
                  {isExpanded && <span>Sign Out</span>}
                </Button>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="right">Sign Out</TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
