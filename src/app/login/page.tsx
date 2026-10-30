import { Suspense } from "react";
import type { Metadata } from "next";

import { PageLoader } from "@/components/ui/PageLoader";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = { title: "Inicio de Sesión | Control TIC" };

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      {/* LoginForm lee ?next= con useSearchParams, que exige un límite de Suspense. */}
      <Suspense fallback={<PageLoader />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
