"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

interface NavbarProps {
  userName?: string;
  userInitials?: string;
  onMenuClick?: () => void;
}

export default function Navbar({
  userName = "Admin User",
  userInitials = "AU",
  onMenuClick,
}: NavbarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <TooltipProvider>
      <header className="bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Link
                href="/dashboard"
                className="flex items-center space-x-3 group"
              >
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-foreground">
                    RUET Admin
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Hall Management
                  </p>
                </div>
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Dark Mode Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                    className="relative"
                  >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle theme</TooltipContent>
              </Tooltip>

              {/* Notifications */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
                    <span className="sr-only">Notifications</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium">
                      {userName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
