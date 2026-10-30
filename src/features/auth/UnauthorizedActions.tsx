"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";

import { primaryButtonClass, secondaryButtonClass } from "@/components/ui/styles";
import { cerrarSesion, useAuthStore } from "@/store/authStore";

/** Parte interactiva de /unauthorized: rol actual y botones. */
export function UnauthorizedActions() {
  const rol = useAuthStore((s) => s.user?.nombreRol);

  return (
    <>
      <p className="mb-6 text-sm leading-relaxed text-sobre-variante">
        Tu cuenta{" "}
        {rol && <span className="font-semibold text-sobre-superficie">({rol})</span>} no tiene
        permisos para ver esta sección.
      </p>

      <div className="flex flex-col gap-2">
        <Link href="/" className={`${primaryButtonClass} w-full py-2.5`}>
          Volver al inicio
        </Link>
        <button type="button" onClick={cerrarSesion} className={`${secondaryButtonClass} w-full py-2.5`}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </>
  );
}
