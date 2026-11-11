import { Mail, UserRound } from "lucide-react";

import { StatusBadge } from "@/components/ui";
import { eventoCorreo } from "@/lib/estados";
import type { ActualizacionTicket } from "@/types/api";

function fechaHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * Seguimiento del ticket: actualizaciones que captura el personal TIC y los
 * correos de ServiceDesk (creado, actualizado, resuelto, cerrado) que el
 * backend lee del buzón y aplica solo. La resolución de la DTIC llega completa.
 */
export function ActualizacionesTicket({ actualizaciones }: { actualizaciones: ActualizacionTicket[] }) {
  const ordenadas = [...actualizaciones].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return (
    <section aria-labelledby="titulo-seguimiento" className="flex flex-col gap-3">
      <h3 id="titulo-seguimiento" className="text-xs font-extrabold uppercase tracking-[0.08em] text-sobre-variante">
        Seguimiento del ticket
      </h3>
      <ul className="flex flex-col gap-2">
        {ordenadas.map((a) => {
          const correo = a.origen === "CORREO";
          return (
            <li key={a.idActualizacion} className="flex gap-3 rounded-xl bg-superficie px-4 py-3">
              {correo ? (
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden="true" />
              ) : (
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-verde" aria-hidden="true" />
              )}
              <div className="min-w-0">
                {correo && a.evento && <StatusBadge {...eventoCorreo(a.evento)} className="mb-1.5" />}
                <p className="whitespace-pre-line break-words text-sm leading-relaxed">{a.descripcion}</p>
                <p className="mt-1 text-[11px] text-outline">
                  {fechaHora(a.fecha)} · {correo ? `Correo de ServiceDesk${a.correoAsunto ? `: ${a.correoAsunto}` : ""}` : (a.usuario ?? "TICS")}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
