import { Suspense } from "react";
import type { Metadata } from "next";

import { PageLoader } from "@/components/ui/PageLoader";
import { MisReservasPage } from "@/features/reservas/MisReservasPage";

/**
 * La página depende de la sesión, que AuthGuard verifica en el navegador
 * (GET /api/auth/me); en el servidor solo se renderiza el indicador de carga.
 * Por eso se excluye de la validación de navegación instantánea de Next.js 16
 * (aviso solo de desarrollo "Could not validate that a segment...").
 */
export const instant = false;

export const metadata: Metadata = { title: "Mis reservas | Control TIC" };

export default function Page() {
  // MisReservasPage lee ?reserva= (resaltar la reserva al llegar desde un aviso)
  return (
    <Suspense fallback={<PageLoader />}>
      <MisReservasPage />
    </Suspense>
  );
}
