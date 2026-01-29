"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface LayoutContextType {
  isSidebarPinned: boolean;
  isSidebarHovered: boolean;
  isMobileOpen: boolean;
  togglePin: () => void;
  setHovered: (hovered: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const togglePin = () => setIsSidebarPinned((prev) => !prev);
  const setHovered = (hovered: boolean) => setIsSidebarHovered(hovered);
  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  // Close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        isSidebarPinned,
        isSidebarHovered,
        isMobileOpen,
        togglePin,
        setHovered,
        toggleMobile,
        closeMobile,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
