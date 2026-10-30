import { estadoSolicitudTecnica } from "@/lib/estados";
import type { HistorialSolicitud as Historial } from "@/types/api";

function fechaHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Línea de tiempo de cambios de estado (el backend la entrega del más reciente al más antiguo). */
export function HistorialSolicitud({ historial }: { historial: Historial[] }) {
  return (
    <section aria-labelledby="titulo-historial" className="border-t border-variante pt-5">
      <h3 id="titulo-historial" className="mb-4 text-xs font-extrabold uppercase tracking-[0.08em] text-sobre-variante">
        Historial de seguimiento
      </h3>
      <ol className="flex flex-col">
        {historial.map((h, i) => (
          <li key={h.idHistorial} className="relative flex gap-3 pb-4 last:pb-0">
            {i < historial.length - 1 && (
              <span className="absolute bottom-0 left-[7px] top-5 w-0.5 bg-variante" aria-hidden="true" />
            )}
            <span className="mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-verde-claro bg-verde" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-bold">{estadoSolicitudTecnica(h.estadoNuevo).etiqueta}</p>
              {h.comentario && <p className="text-[13px] text-sobre-variante">{h.comentario}</p>}
              <p className="mt-0.5 text-[11px] text-outline">
                {fechaHora(h.fechaCambio)} · {h.usuarioAccionNombre}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
