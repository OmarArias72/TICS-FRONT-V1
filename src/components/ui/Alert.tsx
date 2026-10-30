import type { ReactNode } from "react";
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/cn";

type TonoAviso = "info" | "alerta" | "error" | "ok" | "neutro";

const estilos: Record<TonoAviso, { caja: string; icono: string; Icono: typeof Info }> = {
  info: { caja: "bg-dorado-claro text-dorado-oscuro", icono: "text-dorado-oscuro", Icono: Info },
  alerta: { caja: "bg-alerta-claro text-alerta-oscuro", icono: "text-alerta", Icono: TriangleAlert },
  error: { caja: "bg-error-claro text-error-oscuro", icono: "text-error", Icono: CircleX },
  ok: { caja: "bg-verde-claro text-verde-oscuro", icono: "text-verde", Icono: CircleCheck },
  neutro: { caja: "bg-variante text-sobre-variante", icono: "text-sobre-variante", Icono: Info },
};

interface AlertProps {
  tone?: TonoAviso;
  title?: string;
  children?: ReactNode;
  /** Botón o enlace a la derecha del aviso. */
  action?: ReactNode;
  className?: string;
}

/** Aviso dentro de la página (no confundir con los avisos emergentes de react-hot-toast). */
export function Alert({ tone = "info", title, children, action, className }: AlertProps) {
  const { caja, icono, Icono } = estilos[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "note"}
      className={cn("flex flex-wrap items-start gap-3 rounded-xl px-4 py-3.5 text-sm", caja, className)}
    >
      <Icono className={cn("mt-0.5 h-5 w-5 shrink-0", icono)} aria-hidden="true" />
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <p className="font-bold">{title}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
