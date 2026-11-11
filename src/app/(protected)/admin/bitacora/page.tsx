import { Suspense } from "react";
import type { Metadata } from "next";

import { PageLoader } from "@/components/ui/PageLoader";
import { BitacoraPage } from "@/features/bitacora/BitacoraPage";

/**
 * La página depende de la sesión, que AuthGuard verifica en el navegador
 * (GET /api/auth/me); en el servidor solo se renderiza el indicador de carga.
 * Por eso se excluye de la validación de navegación instantánea de Next.js 16.
 */
export const instant = false;

export const metadata: Metadata = { title: "Bitácora | Control TIC" };

// BitacoraPage lee `?inventario=` y `?vista=` con useSearchParams, que necesita Suspense.
export default function Page() {
  return (
    <Suspense fallback={<PageLoader label="Cargando bitácora..." />}>
      <BitacoraPage />
    </Suspense>
  );
}
