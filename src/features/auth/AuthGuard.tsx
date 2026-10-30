"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PageLoader } from "@/components/ui/PageLoader";
import { puedeAcceder } from "@/lib/auth/roles";
import { useAuthStore } from "@/store/authStore";

type Acceso = "verificando" | "sin-sesion" | "sin-permiso" | "permitido";

/**
 * Reemplaza a ProtectedRoute.jsx.
 *
 * - Sin sesión: envía a /login?next=<ruta actual> (antes se usaba el `state`
 *   de React Router, que no existe en Next.js).
 * - Con sesión pero sin rol permitido: envía a /unauthorized.
 *
 * Mientras la sesión no se ha leído de localStorage muestra un indicador de
 * carga, para no redirigir por error a un usuario que sí tiene sesión.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const acceso: Acceso = !hasHydrated
    ? "verificando"
    : !user
      ? "sin-sesion"
      : puedeAcceder(user.nombreRol, pathname)
        ? "permitido"
        : "sin-permiso";

  useEffect(() => {
    if (acceso === "sin-sesion") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (acceso === "sin-permiso") {
      router.replace("/unauthorized");
    }
  }, [acceso, pathname, router]);

  if (acceso !== "permitido") {
    return <PageLoader label={acceso === "verificando" ? "Verificando sesión..." : "Redirigiendo..."} />;
  }

  return <>{children}</>;
}
