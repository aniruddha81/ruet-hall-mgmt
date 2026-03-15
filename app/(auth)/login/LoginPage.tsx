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
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-muted/20 to-background px-4 py-10">
      <div className="w-full max-w-5xl">
        <Card className="overflow-hidden border-border/70 shadow-2xl">
          <div className="grid md:grid-cols-[0.95fr_1.05fr]">
            <section className="hidden border-r border-border/60 bg-muted/30 p-8 md:flex md:flex-col md:justify-between lg:p-10">
              <div className="space-y-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    RUET Hall Management
                  </p>
                  <h1 className="text-3xl font-bold leading-tight text-foreground">
                    Student Portal Login
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Sign in to view allocation status, notices, and hall
                    services.
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                For registered RUET students only.
              </p>
            </section>

            <section className="p-6 sm:p-8 lg:p-10">
              <CardHeader className="space-y-2 px-0 pt-0 text-center sm:text-left">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground md:hidden">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  Welcome Back
                </CardTitle>
                <CardDescription>
                  Sign in to continue to your RUET hall dashboard.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-0 pb-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
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
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
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

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 w-full text-base"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="relative my-6">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs uppercase text-muted-foreground">
                    Student Access
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  This portal is intended for RUET students only.
                </p>
              </CardContent>

              <CardFooter className="justify-center px-0 sm:justify-start">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="font-semibold text-primary">
                    Sign up
                  </Link>
                </p>
              </CardFooter>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
