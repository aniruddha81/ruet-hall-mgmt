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
import { getApiErrorMessage } from "@/lib/api";
import { adminRegister } from "@/lib/services/auth.service";
import type {
  AcademicDepartment,
  Hall,
  OperationalUnit,
  StaffRole,
} from "@/lib/types";
import {
  ACADEMIC_DEPARTMENTS,
  HALLS,
  OPERATIONAL_UNITS,
  STAFF_ROLES,
} from "@/lib/types";
import {
  CalendarDays,
  Clock3,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const MODULE_ROTATION_MS = 2600;

const modules = [
  "Admissions",
  "Dining",
  "Inventory",
  "Finance",
  "Resident Services",
];

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    academicDepartment: "" as AcademicDepartment | "",
    hall: "" as Hall | "",
    designation: "" as StaffRole | "",
    operationalUnit: "" as OperationalUnit | "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoSrc, setLogoSrc] = useState("/ruet-logo.png");
  const [now, setNow] = useState(() => new Date());
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    const rotateId = window.setInterval(
      () => setActiveModuleIndex((prev) => (prev + 1) % modules.length),
      MODULE_ROTATION_MS,
    );
    return () => window.clearInterval(rotateId);
  }, []);

  const greeting = useMemo(() => getGreeting(now.getHours()), [now]);
  const currentTime = useMemo(
    () =>
      new Intl.DateTimeFormat("en-BD", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now),
    [now],
  );
  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-BD", {
        weekday: "long",
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(now),
    [now],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (
      !formData.hall ||
      !formData.designation ||
      !formData.operationalUnit ||
      !formData.academicDepartment
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      await adminRegister({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        academicDepartment: formData.academicDepartment as AcademicDepartment,
        hall: formData.hall as Hall,
        designation: formData.designation as StaffRole,
        operationalUnit: formData.operationalUnit as OperationalUnit,
        phone: formData.phone,
      });
      router.push("/login");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_15%_15%,#e0f2fe_0%,transparent_35%),radial-gradient(circle_at_90%_80%,#cffafe_0%,transparent_32%),linear-gradient(145deg,#f8fafc,#eef2ff)] px-4 py-8">
      <div className="pointer-events-none absolute -left-28 top-[-100px] h-80 w-80 rounded-full bg-sky-200/55 blur-3xl [animation:float_16s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -right-28 bottom-[-120px] h-[22rem] w-[22rem] rounded-full bg-cyan-200/55 blur-3xl [animation:float_19s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-white/55 blur-2xl" />

      <div className="w-full max-w-6xl">
        <Card className="overflow-hidden border-white/70 bg-white/75 shadow-[0_20px_80px_-24px_rgba(15,23,42,0.35)] backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">

            {/* ── Left hero panel ── */}
            <section className="relative border-border/30 bg-gradient-to-br from-slate-900 via-sky-900 to-cyan-900 p-7 text-white lg:border-r lg:p-10">
              <div className="absolute inset-0 opacity-20 [background:linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.24)_50%,transparent_100%)] [background-size:250%_250%] [animation:shine_12s_linear_infinite]" />
              <div className="relative z-10 space-y-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Secure Command Center
                </div>

                <div className="space-y-5">
                  <Image
                    src={logoSrc}
                    alt="RUET official logo"
                    width={116}
                    height={116}
                    className="rounded-2xl border border-white/30 bg-white/90 p-2.5 shadow-xl"
                    priority
                    onError={() => setLogoSrc("/ruet-logo.svg")}
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-cyan-100/95">
                      {greeting}, Administrator
                    </p>
                    <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
                      RUET Hall Management
                      <span className="block text-cyan-200">Control Portal</span>
                    </h1>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                    <p className="mb-1 inline-flex items-center gap-2 text-xs text-cyan-100">
                      <Clock3 className="h-3.5 w-3.5" />
                      Current Time
                    </p>
                    <p className="text-lg font-semibold">{currentTime}</p>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                    <p className="mb-1 inline-flex items-center gap-2 text-xs text-cyan-100">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Today
                    </p>
                    <p className="text-sm font-medium">{currentDate}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-cyan-100/90">
                    Active Module Focus
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {modules.map((module, index) => {
                      const active = index === activeModuleIndex;
                      return (
                        <span
                          key={module}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-500 ${
                            active
                              ? "scale-105 border-cyan-100 bg-cyan-100 text-slate-900 shadow-lg"
                              : "border-white/35 bg-transparent text-cyan-50"
                          }`}
                        >
                          {module}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-300/15 px-3 py-1 text-xs font-medium text-emerald-100">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  End-to-end monitored administrator access
                </div>
              </div>
            </section>

            {/* ── Right form panel ── */}
            <section className="flex flex-col">
              <CardHeader className="space-y-2 pb-3 text-center sm:text-left">
                <div className="mx-auto mb-2 flex w-fit items-center gap-3 rounded-full border border-border/70 bg-slate-100/80 px-3 py-1.5 sm:mx-0">
                  <Image
                    src={logoSrc}
                    alt="RUET logo"
                    width={28}
                    height={28}
                    className="rounded-md"
                    onError={() => setLogoSrc("/ruet-logo.svg")}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    University Hall Admin
                  </span>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Request Admin Access
                </CardTitle>
                <CardDescription className="text-sm">
                  Submit your details for admin access approval.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto">
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
                      className="h-11 border-slate-300/70 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="email">Official Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@ruet.edu.bd"
                        className="h-11 border-slate-300/70 bg-white"
                      />
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
                        className="h-11 border-slate-300/70 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="academicDepartment">Department</Label>
                      <select
                        id="academicDepartment"
                        name="academicDepartment"
                        required
                        value={formData.academicDepartment}
                        onChange={handleChange}
                        className="flex h-11 w-full rounded-md border border-slate-300/70 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select</option>
                        {ACADEMIC_DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hall">Hall</Label>
                      <select
                        id="hall"
                        name="hall"
                        required
                        value={formData.hall}
                        onChange={handleChange}
                        className="flex h-11 w-full rounded-md border border-slate-300/70 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select</option>
                        {HALLS.map((h) => (
                          <option key={h} value={h}>
                            {h.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation</Label>
                      <select
                        id="designation"
                        name="designation"
                        required
                        value={formData.designation}
                        onChange={handleChange}
                        className="flex h-11 w-full rounded-md border border-slate-300/70 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select</option>
                        {STAFF_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operationalUnit">Unit</Label>
                      <select
                        id="operationalUnit"
                        name="operationalUnit"
                        required
                        value={formData.operationalUnit}
                        onChange={handleChange}
                        className="flex h-11 w-full rounded-md border border-slate-300/70 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select</option>
                        {OPERATIONAL_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
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
                        className="h-11 border-slate-300/70 bg-white pr-10"
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
                        className="h-11 border-slate-300/70 bg-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    className="h-11 w-full bg-slate-900 text-base text-white hover:bg-slate-800"
                  >
                    {isLoading ? "Submitting Request..." : "Request Access"}
                  </Button>
                </form>

                <div className="relative my-6">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs uppercase text-muted-foreground">
                    Note
                  </span>
                </div>

                <p className="text-center text-sm text-muted-foreground sm:text-left">
                  Your request will be reviewed by the super admin. You will
                  receive an email once approved.
                </p>
              </CardContent>

              <CardFooter className="justify-center sm:justify-start">
                <p className="text-sm text-muted-foreground">
                  Already have access?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </section>

          </div>
        </Card>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(20px);
          }
        }

        @keyframes shine {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </div>
  );
}
