import LandingPage from "@/components/home/LandingPage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  // Resolve session state on the server to avoid client-side landing-page flash.
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (refreshToken) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
