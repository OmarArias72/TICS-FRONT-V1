import { cn } from "@/lib/cn";
import type { EstadoSolicitudTecnica } from "@/types/api";

import { PASOS, pasoActual } from "./flujo";

/** Barra de pasos de la solicitud (prototipo "Estudiante - Mesa de Ayuda"). */
export function ProgresoSolicitud({ estado }: { estado: EstadoSolicitudTecnica }) {
  const actual = pasoActual(estado);
  if (actual === null) return null;

  return (
    <ol aria-label="Progreso de la solicitud" className="grid grid-cols-5 gap-2">
      {PASOS.map((nombre, i) => {
        const hecho = i < actual;
        const enCurso = i === actual;
        return (
          <li key={nombre} className="flex flex-col gap-2" aria-current={enCurso ? "step" : undefined}>
            <span
              className={cn("h-1.5 rounded-full", hecho ? "bg-verde" : enCurso ? "bg-dorado" : "bg-variante")}
              aria-hidden="true"
            />
            <span
              className={cn(
                "text-xs",
                enCurso ? "font-extrabold text-sobre-superficie" : "font-semibold text-sobre-variante",
              )}
            >
              {nombre}
              {hecho && <span className="sr-only"> (completado)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
