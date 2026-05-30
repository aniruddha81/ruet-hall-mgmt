import { Suspense } from "react";
import PaymentsPage from "./PaymentsPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <span className="text-muted-foreground">Loading payments…</span>
        </div>
      }
    >
      <PaymentsPage />
    </Suspense>
  );
}
