"use client";

import Image from "next/image";
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
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      <div className="w-full max-w-6xl">
        <Card className="overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2">

            {/* LEFT IMAGE SECTION */}
            <section className="relative hidden md:block min-h-150">
              <Image
                src="/ruet-gate.jpeg"
                alt="RUET Gate"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50"></div>

              {/* Text */}
              <div className="absolute bottom-10 left-10 text-white z-10">
                <p className="text-sm uppercase tracking-wider text-gray-200">
                  RUET Hall Management
                </p>

                <h1 className="text-3xl font-bold leading-tight mt-2">
                  Student Portal Login
                </h1>

                <p className="mt-3 text-sm text-gray-200 max-w-sm">
                  Sign in to view allocation status, notices and hall services.
                </p>
              </div>
            </section>

            {/* RIGHT FORM SECTION */}
            <section className="p-6 sm:p-8 lg:p-10">
              <CardHeader className="space-y-2 px-0 pt-0">
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
                    <div className="rounded-lg border border-red-400 bg-red-100 p-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* EMAIL */}
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="h-11"
                    />
                  </div>

                  {/* PASSWORD */}
                  <div className="space-y-2">
                    <Label>Password</Label>

                    <div className="relative">
                      <Input
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

                  {/* LOGIN BUTTON */}
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
                  <span className="absolute left-1/2 top-1/2 bg-card px-2 text-xs -translate-x-1/2 -translate-y-1/2">
                    Student Access
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  This portal is intended for RUET students only.
                </p>
              </CardContent>

              <CardFooter className="px-0">
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