"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { TransitionLink } from "@/components/ui/transition-link";
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import { useSwipeRouteTransition } from "@/lib/useSwipeRouteTransition";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [rememberMe, setRememberMe] = useState(true);
	const [logoSrc, setLogoSrc] = useState("/ruet-logo.png");

	const searchParams = useSearchParams();
	const showMessage = searchParams.get("signup") === "success";
	const { login } = useAuth();
	const swipeHandlers = useSwipeRouteTransition({
		onSwipeLeft: { href: "/signup", direction: "forward" },
	});

	const handleSubmit = async (e: React.FormEvent) => {
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
		<div
			{...swipeHandlers}
			className="auth-page auth-swipe-shell relative flex min-h-screen touch-pan-y items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_15%_15%,#e0f2fe_0%,transparent_35%),radial-gradient(circle_at_90%_80%,#cffafe_0%,transparent_32%),linear-gradient(145deg,#f8fafc,#eef2ff)] px-4 py-8 [animation:pageFade_700ms_ease-out_both] [view-transition-name:auth-page] dark:bg-[radial-gradient(circle_at_15%_15%,rgba(56,189,248,0.16)_0%,transparent_35%),radial-gradient(circle_at_90%_80%,rgba(34,211,238,0.14)_0%,transparent_32%),linear-gradient(145deg,#020617,#0f172a)]"
		>
			<div className="pointer-events-none absolute -left-28 top-[-100px] h-80 w-80 rounded-full bg-sky-200/55 blur-3xl [animation:float_16s_ease-in-out_infinite] dark:bg-sky-500/20" />
			<div className="pointer-events-none absolute -right-28 bottom-[-120px] h-[22rem] w-[22rem] rounded-full bg-cyan-200/55 blur-3xl [animation:float_19s_ease-in-out_infinite] dark:bg-cyan-500/20" />
			<div className="pobuinter-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-white/55 blur-2xl dark:bg-slate-200/10" />
			<div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.5)_0%,transparent_42%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.25)_0%,transparent_38%)] [animation:drift_24s_linear_infinite] dark:opacity-35" />

			<div className="w-full max-w-6xl">
				<Card className="group overflow-hidden border-white/70 bg-white/75 shadow-[0_20px_80px_-24px_rgba(15,23,42,0.35)] backdrop-blur-md [animation:cardEnter_900ms_cubic-bezier(0.22,1,0.36,1)_both] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_95px_-28px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-slate-950/75">
					<div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
						<section className="relative min-h-[320px] overflow-hidden border-border/30 [animation:slideInLeft_900ms_cubic-bezier(0.22,1,0.36,1)_both] lg:border-r">
							<Image
								src="/male-hall.jpeg"
								alt="RUET male hall building"
								fill
								className="object-cover"
								priority
							/>
							<div className="absolute inset-0 bg-gradient-to-br from-slate-950/78 via-sky-950/52 to-cyan-900/40" />
							<div className="absolute inset-0 opacity-20 [background:linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.24)_50%,transparent_100%)] [background-size:250%_250%] [animation:shine_12s_linear_infinite]" />
							<div className="relative z-10 flex h-full min-h-[320px] items-end p-7 text-white lg:p-10">
								<div className="space-y-5">
									<Image
										src={logoSrc}
										alt="RUET official logo"
										width={88}
										height={88}
										className="rounded-2xl border border-white/30 bg-white/90 p-2 shadow-xl"
										priority
										onError={() => setLogoSrc("/ruet-logo.svg")}
									/>
									<div className="max-w-md space-y-2">
										<h1 className="text-3xl font-bold leading-tight text-white lg:text-4xl">
											RUET Hall Management Control Panel
										</h1>
									</div>
								</div>
							</div>
						</section>

						<section className="[animation:slideInRight_900ms_cubic-bezier(0.22,1,0.36,1)_both]">
							<CardHeader className="space-y-2 pb-3 text-center [animation:fadeUp_700ms_ease-out_both] [animation-delay:140ms] sm:text-left">
								<div className="mx-auto mb-2 flex w-fit items-center gap-3 rounded-full border border-border/70 bg-slate-100/80 px-3 py-1.5 sm:mx-0 dark:bg-slate-900/70">
									<Image
										src={logoSrc}
										alt="RUET logo"
										width={28}
										height={28}
										className="rounded-md"
										onError={() => setLogoSrc("/ruet-logo.svg")}
									/>
									<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										RUET Hall Admin
									</span>
								</div>
								<CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sign In</CardTitle>
								<CardDescription className="text-sm">
									Enter your authorized university credentials to continue.
								</CardDescription>
								{showMessage && (
									<Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
										<AlertTitle>Signup successful!</AlertTitle>
										<AlertDescription>
											Your request has been submitted. You will receive approval via email.
										</AlertDescription>
									</Alert>
								)}
							</CardHeader>

							<CardContent className="[animation:fadeUp_720ms_ease-out_both] [animation-delay:220ms]">
								<form onSubmit={handleSubmit} className="space-y-4">
									{error && (
										<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive [animation:fadeUp_540ms_ease-out_both] [animation-delay:260ms]">
											{error}
										</div>
									)}

									<div className="space-y-2 [animation:fadeUp_560ms_ease-out_both] [animation-delay:280ms]">
										<Label htmlFor="email">University Email</Label>
										<Input
											id="email"
											type="email"
											required
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="admin@ruet.ac.bd"
											className="h-11 border-slate-300/70 bg-white dark:border-slate-700 dark:bg-slate-900/70"
										/>
									</div>

									<div className="space-y-2 [animation:fadeUp_560ms_ease-out_both] [animation-delay:340ms]">
										<Label htmlFor="password">Password</Label>
										<div className="relative">
											<Input
												id="password"
												type={showPassword ? "text" : "password"}
												required
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												placeholder="Enter your password"
												className="h-11 border-slate-300/70 bg-white pr-10 dark:border-slate-700 dark:bg-slate-900/70"
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

									<div className="flex items-center justify-between gap-3 [animation:fadeUp_560ms_ease-out_both] [animation-delay:400ms]">
										<label htmlFor="remember" className="flex cursor-pointer items-center gap-2">
											<input
												id="remember"
												type="checkbox"
												checked={rememberMe}
												onChange={(e) => setRememberMe(e.target.checked)}
												className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
											/>
											<span className="text-sm text-muted-foreground">Remember me</span>
										</label>
										<Link
											href="/forgot-password"
											className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
										>
											Forgot password?
										</Link>
									</div>

									<Button
										type="submit"
										disabled={isLoading}
										className="h-11 w-full bg-slate-900 text-base text-white transition-all duration-300 [animation:fadeUp_560ms_ease-out_both] [animation-delay:460ms] hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
									>
										{isLoading ? "Signing in..." : "Sign In to Dashboard"}
									</Button>
								</form>

								<div className="relative my-6 [animation:fadeUp_560ms_ease-out_both] [animation-delay:520ms]">
									<Separator />
									<span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs uppercase text-muted-foreground dark:bg-slate-950">
										Protected Access
									</span>
								</div>

								<p className="text-center text-sm text-muted-foreground [animation:fadeUp_560ms_ease-out_both] [animation-delay:580ms] sm:text-left">
									This portal is restricted to authorized hall administrators.
									Unauthorized attempts are logged and reviewed.
								</p>
							</CardContent>

							<CardFooter className="justify-center [animation:fadeUp_560ms_ease-out_both] [animation-delay:640ms] sm:justify-start">
								<p className="text-sm text-muted-foreground">
									Need admin access?{" "}
									<TransitionLink
										href="/signup"
										direction="forward"
										className="font-semibold text-primary transition-colors hover:text-primary/80"
									>
										Request Access
									</TransitionLink>
								</p>
							</CardFooter>
						</section>
					</div>
				</Card>
			</div>

			<style jsx>{`
				@keyframes pageFade {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}

				@keyframes cardEnter {
					0% {
						opacity: 0;
						transform: translateY(24px) scale(0.985);
					}
					100% {
						opacity: 1;
						transform: translateY(0) scale(1);
					}
				}

				@keyframes slideInLeft {
					0% {
						opacity: 0;
						transform: translateX(-28px);
					}
					100% {
						opacity: 1;
						transform: translateX(0);
					}
				}

				@keyframes slideInRight {
					0% {
						opacity: 0;
						transform: translateX(28px);
					}
					100% {
						opacity: 1;
						transform: translateX(0);
					}
				}

				@keyframes fadeUp {
					from {
						opacity: 0;
						transform: translateY(16px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				@keyframes drift {
					0% {
						transform: translate3d(0, 0, 0) scale(1);
					}
					50% {
						transform: translate3d(1.8%, -1.2%, 0) scale(1.04);
					}
					100% {
						transform: translate3d(0, 0, 0) scale(1);
					}
				}

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

				@media (prefers-reduced-motion: reduce) {
					* {
						animation: none !important;
						transition: none !important;
					}
				}
			`}</style>
		</div>
	);
}
