import { Suspense, type ReactNode } from "react";

import { PageLoader } from "@/components/ui/PageLoader";
import { AuthGuard } from "@/features/auth/AuthGuard";

/**
 * Layout de todas las rutas que exigen sesión. El grupo "(protected)" no
 * aparece en la URL: /aulas sigue siendo /aulas.
 *
 * El layout es un Server Component; solo el guard se ejecuta en el cliente,
 * porque la sesión vive en localStorage.
 */
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoader label="Verificando sesión..." />}>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}
