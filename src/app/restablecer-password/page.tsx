import { Suspense } from "react";
import type { Metadata } from "next";

import { PageLoader } from "@/components/ui/PageLoader";
import { RestablecerPasswordForm } from "@/features/auth/RestablecerPasswordForm";

export const metadata: Metadata = { title: "Nueva contraseña | Control TIC" };

/** Pública: se abre desde el enlace del correo (?token=). */
export default function RestablecerPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Suspense fallback={<PageLoader />}>
        <RestablecerPasswordForm />
      </Suspense>
    </div>
  );
}
