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
import { studentRegister } from "@/lib/services/auth.service";
import type { AcademicDepartment } from "@/lib/types";
import { ACADEMIC_DEPARTMENTS } from "@/lib/types";
import { Eye, EyeOff, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rollNumber: "",
    academicDepartment: "" as AcademicDepartment | "",
    session: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!formData.academicDepartment) {
      setError("Please select your department");
      return;
    }

    setIsLoading(true);

    try {
      const res = await studentRegister({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        rollNumber: parseInt(formData.rollNumber),
        academicDepartment: formData.academicDepartment as AcademicDepartment,
        session: formData.session,
        phone: formData.phone,
      });
      // Tokens are already set in cookies — build user state and go to dashboard
      setUser({
        id: res.data.user.id,
        email: res.data.user.email,
        name: res.data.user.name,
        phone: formData.phone,
        academicDepartment: formData.academicDepartment as AcademicDepartment,
        rollNumber: formData.rollNumber,
        session: formData.session,
        hall: null,
        roomId: null,
        status: null,
        isAllocated: false,
      });
      router.push("/dashboard");
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
                  <UserRoundPlus className="h-7 w-7" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    RUET Hall Management
                  </p>
                  <h1 className="text-3xl font-bold leading-tight text-foreground">
                    Student Account Signup
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Create your account to access hall allocation updates and
                    student services.
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Use your own academic and contact information.
              </p>
            </section>

            <section className="p-6 sm:p-8 lg:p-10">
              <CardHeader className="space-y-2 px-0 pt-0 text-center sm:text-left">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground md:hidden">
                  <UserRoundPlus className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  Create Account
                </CardTitle>
                <CardDescription>
                  Join RUET Hall Management System
                </CardDescription>
              </CardHeader>

              <CardContent className="max-h-[70vh] overflow-y-auto px-0 pb-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="h-11"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="rollNumber">Roll Number</Label>
                      <Input
                        id="rollNumber"
                        name="rollNumber"
                        type="number"
                        required
                        value={formData.rollNumber}
                        onChange={handleChange}
                        placeholder="e.g. 2004001"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session">Session</Label>
                      <Input
                        id="session"
                        name="session"
                        type="text"
                        required
                        value={formData.session}
                        onChange={handleChange}
                        placeholder="e.g. 2020-21"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="academicDepartment">Department</Label>
                      <select
                        id="academicDepartment"
                        name="academicDepartment"
                        required
                        value={formData.academicDepartment}
                        onChange={handleChange}
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select</option>
                        {ACADEMIC_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="text"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="01XXXXXXXXX"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a strong password"
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
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
                    {isLoading ? "Creating Account..." : "Sign Up"}
                  </Button>
                </form>

                <div className="relative my-6">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs uppercase text-muted-foreground">
                    Student Registration
                  </span>
                </div>
              </CardContent>

              <CardFooter className="justify-center px-0 sm:justify-start">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-primary">
                    Sign in
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
