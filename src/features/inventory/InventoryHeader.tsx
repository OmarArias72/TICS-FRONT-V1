"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { PageHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import { usePermiso } from "@/features/auth/usePermiso";

/**
 * Encabezado común de Inventario con las pestañas Equipos | Conteos
 * (decisión 2026-10-30). Cada pestaña conserva su propia URL.
 */
export function InventoryHeader({ description, actions }: { description?: ReactNode; actions?: ReactNode }) {
  const pathname = usePathname();
  const verConteos = usePermiso("inventario.conteos");

  const pestanas = [
    { href: "/inventario", label: "Equipos" },
    ...(verConteos ? [{ href: "/inventario/conteo", label: "Conteos" }] : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Centro Universitario UAEM Tianguistenco"
        title="Gestión de Inventario"
        description={description}
        actions={actions}
      />
      <nav aria-label="Secciones de inventario" className="flex gap-1 border-b border-variante">
        {pestanas.map((p) => {
          const activa = pathname === p.href;
          return (
            <Link
              key={p.href}
              href={p.href}
              aria-current={activa ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition-colors",
                activa
                  ? "border-verde text-verde"
                  : "border-transparent text-sobre-variante hover:border-outline hover:text-sobre-superficie",
              )}
            >
              {p.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
