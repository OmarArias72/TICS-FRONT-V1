import { cn } from "@/lib/cn";
import type { EstadoVisual, Tono } from "@/lib/estados";

const tonos: Record<Tono, string> = {
  ok: "bg-verde-claro text-verde-oscuro",
  alerta: "bg-alerta-claro text-alerta-oscuro",
  error: "bg-error-claro text-error-oscuro",
  info: "bg-info-claro text-info-oscuro",
  dorado: "bg-dorado-claro text-dorado-oscuro",
  neutro: "bg-variante text-sobre-variante",
};

type StatusBadgeProps = (EstadoVisual | { tono: Tono; etiqueta: string }) & {
  className?: string;
};

/**
 * Etiqueta de estado con punto de color.
 * Uso habitual: <StatusBadge {...estadoEquipo(equipo.estado)} />
 */
export function StatusBadge({ tono, etiqueta, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold",
        tonos[tono],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {etiqueta}
    </span>
  );
}

/** Contador pequeño (por ejemplo, número de solicitudes pendientes). */
export function CountBadge({ value, tono = "alerta" }: { value: number; tono?: Tono }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-extrabold", tonos[tono])}>
      {value}
    </span>
  );
}
