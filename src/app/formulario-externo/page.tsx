import { Suspense } from "react";
import type { Metadata } from "next";

import { PageLoader } from "@/components/ui/PageLoader";
import { FormularioExternoPage } from "@/features/mesa-ayuda";

export const metadata: Metadata = {
  title: "Formulario de solicitud | Control TIC",
  // El enlace es personal: que no lo indexen ni lo envíen como referer
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Pública: llega desde el enlace (?token=) del correo de una solicitud externa. */
export default function FormularioExterno() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FormularioExternoPage />
    </Suspense>
  );
}
