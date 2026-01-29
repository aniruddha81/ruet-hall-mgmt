"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Add your login logic here
    console.log({ email, password });

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-background to-muted/30 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 w-14 h-14 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>
              Sign in to RUET Hall Management Admin Panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ruet.edu.bd"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Remember me
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-base"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground uppercase">
                Admin Access Only
              </span>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              This portal is restricted to authorized administrators only.
              Unauthorized access attempts will be logged.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Need admin access?{" "}
              <Link
                href="/signup"
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                Request Access
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
