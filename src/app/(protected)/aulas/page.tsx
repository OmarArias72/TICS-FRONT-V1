import { Suspense } from "react";
import type { Metadata } from "next";

import { PageLoader } from "@/components/ui/PageLoader";
import { AulasPage } from "@/features/aulas/AulasPage";

export const metadata: Metadata = { title: "Mapa de Aulas | Control TIC" };

// AulasPage lee `?sala=` con useSearchParams, que necesita un límite de Suspense.
export default function Page() {
  return (
    <Suspense fallback={<PageLoader label="Cargando salas..." />}>
      <AulasPage />
    </Suspense>
  );
}
