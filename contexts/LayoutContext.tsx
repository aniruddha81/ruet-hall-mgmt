"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

interface LayoutContextType {
  isSidebarPinned: boolean;
  isSidebarHovered: boolean;
  isMobileOpen: boolean;
  hasHydratedSidebarPin: boolean;
  togglePin: () => void;
  setHovered: (hovered: boolean) => void;
  openMobile: () => void;
  closeMobile: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);
const SIDEBAR_PIN_STORAGE_KEY = "ruet-hall-web.sidebar-pinned";

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hasHydratedSidebarPin, setHasHydratedSidebarPin] = useState(false);

  const togglePin = () => {
    setIsSidebarPinned((prev) => !prev);
  };

  const setHovered = (hovered: boolean) => {
    setIsSidebarHovered(hovered);
  };

  const openMobile = () => {
    setIsMobileOpen(true);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  useLayoutEffect(() => {
    try {
      const savedValue = window.localStorage.getItem(SIDEBAR_PIN_STORAGE_KEY);
      setIsSidebarPinned(savedValue === "true");
    } catch {
      setIsSidebarPinned(false);
    } finally {
      setHasHydratedSidebarPin(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedSidebarPin) {
      return;
    }

    try {
      window.localStorage.setItem(
        SIDEBAR_PIN_STORAGE_KEY,
        String(isSidebarPinned),
      );
    } catch {
      // Ignore storage errors so layout state still works in memory.
    }
  }, [hasHydratedSidebarPin, isSidebarPinned]);

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
        hasHydratedSidebarPin,
        togglePin,
        setHovered,
        openMobile,
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
