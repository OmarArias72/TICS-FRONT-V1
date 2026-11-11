import { Suspense } from "react";
import type { Metadata } from "next";

import { PageLoader } from "@/components/ui/PageLoader";
import { VerificarCorreoForm } from "@/features/auth/VerificarCorreoForm";

export const metadata: Metadata = { title: "Verificar correo | Control TIC" };

/** Pública: llega desde el registro (?correo=), el login o el enlace del correo (?token=). */
export default function VerificarCorreoPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      {/* El formulario lee ?token= y ?correo= con useSearchParams, que exige Suspense. */}
      <Suspense fallback={<PageLoader />}>
        <VerificarCorreoForm />
      </Suspense>
    </div>
  );
}
