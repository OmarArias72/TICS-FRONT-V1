"use client";

import Link from "next/link";
import { CalendarDays, LogIn, MapPinned, UserPlus } from "lucide-react";

import { primaryButtonClass, secondaryButtonClass } from "@/components/ui/styles";
import { useAuthStore } from "@/store/authStore";

/**
 * Acciones de la portada que dependen de la sesión.
 *
 * Corrección respecto al original: el saludo usaba `user.name`, campo que el
 * backend no envía (UsuarioResponseDTO usa `nombre`), y aparecía vacío.
 */
export function LandingSessionActions() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  // Reserva el espacio mientras se lee la sesión para evitar saltos de diseño.
  if (!hasHydrated) {
    return <div className="h-32" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link href="/login" className={`${primaryButtonClass} w-full px-8 py-4 text-base sm:w-auto`}>
          <LogIn className="h-5 w-5" aria-hidden="true" />
          Iniciar Sesión
        </Link>
        <Link
          href="/registro"
          className={`${secondaryButtonClass} w-full px-8 py-4 text-base sm:w-auto`}
        >
          <UserPlus className="h-5 w-5" aria-hidden="true" />
          Registrarse
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-variante bg-white p-6 shadow-lg shadow-verde-oscuro/5">
      <p className="text-xs font-bold uppercase tracking-wider text-outline">Sesión Iniciada</p>
      <p className="text-lg font-bold text-sobre-superficie">
        Bienvenido(a), <span className="text-verde">{user.nombre}</span>
      </p>
      <div className="flex gap-3 pt-2">
        <Link href="/aulas" className={`${primaryButtonClass} flex-1 px-4 py-3`}>
          <MapPinned className="h-4 w-4" aria-hidden="true" />
          Ver Mapa de Aulas
        </Link>
        <Link
          href="/reservas"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-verde-oscuro px-4 py-3 text-sm font-bold text-superficie transition-colors hover:bg-verde"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Reservar Sala
        </Link>
      </div>
    </div>
  );
}
