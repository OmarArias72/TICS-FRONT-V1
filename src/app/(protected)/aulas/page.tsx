import { Suspense } from "react";
import type { Metadata } from "next";

import { PageLoader } from "@/components/ui/PageLoader";
import { AulasPage } from "@/features/aulas/AulasPage";

/**
 * La página depende de la sesión, que AuthGuard verifica en el navegador
 * (GET /api/auth/me); en el servidor solo se renderiza el indicador de carga.
 * Por eso se excluye de la validación de navegación instantánea de Next.js 16
 * (aviso solo de desarrollo "Could not validate that a segment...").
 */
export const instant = false;

export const metadata: Metadata = { title: "Mapa de Aulas | Control TIC" };

// AulasPage lee `?sala=` con useSearchParams, que necesita un límite de Suspense.
export default function Page() {
  return (
    <Suspense fallback={<PageLoader label="Cargando salas..." />}>
      <AulasPage />
    </Suspense>
  );
}
