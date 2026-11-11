import { Suspense } from "react";
import type { Metadata } from "next";

import { PageLoader } from "@/components/ui/PageLoader";
import { OlvidePasswordForm } from "@/features/auth/OlvidePasswordForm";

export const metadata: Metadata = { title: "Recuperar contraseña | Control TIC" };

export default function OlvidePasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Suspense fallback={<PageLoader />}>
        <OlvidePasswordForm />
      </Suspense>
    </div>
  );
}
