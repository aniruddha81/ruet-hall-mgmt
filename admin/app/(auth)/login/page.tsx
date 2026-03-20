import { Suspense } from "react";
import LoginPage from "./LoginPage";

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
