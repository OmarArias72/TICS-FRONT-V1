"use client";

import Link from "next/link";
import { ArrowRight, LogIn, UserPlus } from "lucide-react";

import { primaryButtonClass, secondaryButtonClass } from "@/components/ui/styles";
import { INICIO_POR_ROL, enlacesDeMenu } from "@/lib/auth/roles";
import { useAuthStore } from "@/store/authStore";

/**
 * Acciones de la portada que dependen de la sesión.
 *
 * Con sesión muestra un acceso a la sección principal del rol y a sus demás
 * secciones, tomadas de la misma tabla que el menú. Antes mostraba "Mapa de
 * Aulas" y "Reservar Sala" a todos, aunque algunos roles no podían entrar.
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

  const inicio = INICIO_POR_ROL[user.nombreRol];
  const secciones = [
    ...enlacesDeMenu(user.nombreRol, "principal"),
    ...enlacesDeMenu(user.nombreRol, "admin"),
  ];
  const principal = secciones.find((s) => s.href === inicio);
  const otras = secciones.filter((s) => s.href !== inicio);

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-variante bg-white p-6 shadow-lg shadow-verde-oscuro/5">
      <p className="text-xs font-bold uppercase tracking-wider text-outline">Sesión Iniciada</p>
      <p className="text-lg font-bold text-sobre-superficie">
        Bienvenido(a), <span className="text-verde">{user.nombre}</span>
      </p>

      <Link href={inicio} className={`${primaryButtonClass} w-full`}>
        Ir a {principal?.label ?? "mi sección"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>

      {otras.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {otras.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-full border border-variante bg-superficie px-3 py-1 text-xs font-semibold text-sobre-variante transition-colors hover:border-verde hover:text-verde"
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
