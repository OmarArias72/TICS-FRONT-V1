"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HardDrive, ShieldCheck } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/ui";
import { usePermiso } from "@/features/auth/hooks/usePermiso";
import { cn } from "@/lib/cn";

import { AuditoriaView } from "../components/AuditoriaView";
import { BitacoraEquiposView } from "../components/BitacoraEquiposView";

type Vista = "equipos" | "sistema";

/**
 * Módulo de logs (trazabilidad).
 *
 * - Equipos (Admin y Operador-tics): quién registró, modificó, cambió de
 *   estado, consultó contraseñas o eliminó cada equipo de Inventario y del
 *   Mapa de Aulas.
 * - Sistema (solo Admin): la auditoría general.
 *
 * URL: `/admin/bitacora?inventario=INV-001` filtra por un equipo (enlace
 * "Historial" de Inventario y Mapa de Aulas); `?vista=sistema` abre la auditoría.
 */
export function BitacoraPage() {
  const puedeVerSistema = usePermiso("bitacora.sistema");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const inventario = searchParams.get("inventario") ?? "";
  const vista: Vista = puedeVerSistema && searchParams.get("vista") === "sistema" ? "sistema" : "equipos";

  const cambiarVista = (v: Vista) => {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "sistema") params.set("vista", "sistema");
    else params.delete("vista");
    params.delete("inventario");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Administración TIC"
        title="Bitácora"
        description={
          puedeVerSistema
            ? "Trazabilidad de los cambios: quién registró o modificó cada equipo y todas las acciones del sistema."
            : "Trazabilidad de los equipos: quién los registró, modificó, cambió de estado o eliminó."
        }
      />

      {puedeVerSistema && (
        <div role="tablist" aria-label="Tipo de registro" className="flex gap-1 border-b border-variante">
          {(
            [
              { valor: "equipos", etiqueta: "Equipos", icono: HardDrive },
              { valor: "sistema", etiqueta: "Sistema (auditoría)", icono: ShieldCheck },
            ] as const
          ).map((t) => {
            const activa = vista === t.valor;
            const Icono = t.icono;
            return (
              <button
                key={t.valor}
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() => cambiarVista(t.valor)}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado",
                  activa ? "border-verde text-verde" : "border-transparent text-sobre-variante hover:text-sobre-superficie",
                )}
              >
                <Icono className="h-4 w-4" aria-hidden="true" />
                {t.etiqueta}
              </button>
            );
          })}
        </div>
      )}

      {vista === "sistema" ? (
        <AuditoriaView />
      ) : (
        // La key reinicia los filtros al llegar desde "Historial" de otro equipo.
        <BitacoraEquiposView key={inventario} inventarioInicial={inventario} />
      )}
    </PageContainer>
  );
}
