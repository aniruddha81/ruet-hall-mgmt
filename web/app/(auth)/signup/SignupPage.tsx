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
import {
  getAcademicSessions,
  studentRegister,
} from "@/lib/services/auth.service";
import type { AcademicDepartment, AcademicSession } from "@/lib/types";
import { ACADEMIC_DEPARTMENTS } from "@/lib/types";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [sessions, setSessions] = useState<AcademicSession[]>([]);

  const router = useRouter();
  const { setUser } = useAuth();

  useEffect(() => {
    getAcademicSessions()
      .then((res) => setSessions(res.data.sessions ?? []))
      .catch(() => {
        setSessions([]);
      });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

    if (!formData.session) {
      setError("Please select your session");
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

      setUser({
        id: res.data.user.id,
        email: res.data.user.email,
        name: res.data.user.name,
        phone: formData.phone,
        avatarUrl: null,
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
      <div className="w-full max-w-6xl">
        <Card className="overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2">
            {/* LEFT IMAGE SECTION */}
            <section className="relative hidden md:block">
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
                <h1 className="text-3xl font-bold leading-tight">
                  RUET Hall Management
                  <br />
                  Control Panel
                </h1>

                <p className="mt-3 text-sm text-gray-200 max-w-sm">
                  Manage hall allocation, student services and administration
                  easily.
                </p>
              </div>
            </section>

            {/* RIGHT FORM SECTION */}
            <section className="p-8 lg:p-10">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl font-bold">
                  Create Account
                </CardTitle>
                <CardDescription>
                  Join RUET Hall Management System
                </CardDescription>
              </CardHeader>

              <CardContent className="px-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-lg border border-red-400 bg-red-100 p-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Roll Number</Label>
                      <Input
                        type="number"
                        name="rollNumber"
                        required
                        value={formData.rollNumber}
                        onChange={handleChange}
                        placeholder="2004001"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Session</Label>
                      <select
                        name="session"
                        required
                        value={formData.session}
                        onChange={handleChange}
                        className="w-full border rounded-md h-10 px-3 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select</option>
                        {sessions.map((session) => (
                          <option key={session.id} value={session.label}>
                            {session.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <select
                        name="academicDepartment"
                        value={formData.academicDepartment}
                        onChange={handleChange}
                        className="w-full border rounded-md h-10 px-3 dark:bg-gray-800 dark:text-white"
                        required
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
                      <Label>Phone</Label>
                      <Input
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div className="space-y-2">
                    <Label>Password</Label>

                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create password"
                      />

                      <button
                        type="button"
                        className="absolute right-3 top-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>

                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm password"
                      />

                      <button
                        type="button"
                        className="absolute right-3 top-3"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Sign Up"}
                  </Button>
                </form>

                <div className="relative my-6">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 bg-white dark:bg-gray-800 px-2 text-xs -translate-x-1/2 -translate-y-1/2">
                    Student Registration
                  </span>
                </div>
              </CardContent>

              <CardFooter className="px-0">
                <p className="text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary font-semibold">
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
