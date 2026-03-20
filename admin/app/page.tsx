import { redirect } from "next/navigation";

export default function Home() {
  // Middleware handles auth gating:
  // - authenticated → allowed to /dashboard
  // - unauthenticated → redirected to /login
  redirect("/dashboard");
}
