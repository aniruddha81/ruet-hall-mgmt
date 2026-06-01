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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useOtpResendCooldown } from "@/hooks/use-otp-resend-cooldown";
import { getApiErrorMessage, getApiOtpRetryAfterSec } from "@/lib/api";
import { getResendCooldownSec } from "@/lib/otp";
import {
  getAcademicSessions,
  resendStudentOtp,
  studentRegister,
  verifyStudentEmail,
} from "@/lib/services/auth.service";
import type { AcademicDepartment, AcademicSession } from "@/lib/types";
import { ACADEMIC_DEPARTMENTS } from "@/lib/types";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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

  const [step, setStep] = useState<"register" | "verify">("register");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);

  const { setUser } = useAuth();
  const {
    canResend,
    startCooldown,
    resendLabel,
  } = useOtpResendCooldown();

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

      setVerifyEmail(formData.email);
      setOtp("");
      startCooldown(getResendCooldownSec(res.data));
      setInfo("We sent a 6-digit code to your email. Enter it below to finish signup.");
      setStep("verify");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (otp.length !== 6) {
      setError("Enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyStudentEmail({ email: verifyEmail, otp });
      setUser(res.data.student_data);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError(null);
    setInfo(null);
    setIsLoading(true);
    try {
      const res = await resendStudentOtp({ email: verifyEmail });
      startCooldown(getResendCooldownSec(res.data));
      setInfo("A new verification code was sent to your email.");
    } catch (err) {
      const retryAfter = getApiOtpRetryAfterSec(err);
      if (retryAfter) startCooldown(retryAfter);
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
                  {step === "verify" ? "Verify Email" : "Create Account"}
                </CardTitle>
                <CardDescription>
                  {step === "verify" ? (
                    <>
                      Enter the verification code we sent to your email address:{" "}
                      <span className="font-medium text-foreground">
                        {verifyEmail}
                      </span>
                      .
                    </>
                  ) : (
                    "Join RUET Hall Management System"
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-0">
                {step === "verify" ? (
                  <form onSubmit={handleVerify} className="space-y-6">
                    {error && (
                      <div className="rounded-lg border border-red-400 bg-red-100 p-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}
                    {info && (
                      <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                        {info}
                      </div>
                    )}
                    <Field>
                      <div className="flex items-center justify-between gap-2">
                        <FieldLabel htmlFor="otp-verification">
                          Verification code
                        </FieldLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
                          disabled={isLoading || !canResend}
                          onClick={handleResendOtp}
                        >
                          <RefreshCw
                            className={
                              isLoading ? "animate-spin" : undefined
                            }
                          />
                          {canResend ? "Resend Code" : resendLabel}
                        </Button>
                      </div>
                      <InputOTP
                        id="otp-verification"
                        maxLength={6}
                        value={otp}
                        onChange={(value) =>
                          setOtp(value.replace(/\D/g, "").slice(0, 6))
                        }
                        disabled={isLoading}
                        required
                        autoComplete="one-time-code"
                        containerClassName="justify-center sm:justify-start"
                      >
                        <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator className="mx-2" />
                        <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </Field>
                    <div className="space-y-3">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || otp.length !== 6}
                      >
                        {isLoading ? "Verifying..." : "Verify"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        disabled={isLoading}
                        onClick={() => {
                          setStep("register");
                          setError(null);
                          setInfo(null);
                        }}
                      >
                        Back to registration
                      </Button>
                    </div>
                  </form>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-lg border border-red-400 bg-red-100 p-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}
                  {info && (
                    <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                      {info}
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
                )}

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
