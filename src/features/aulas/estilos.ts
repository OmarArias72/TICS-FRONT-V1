import type { Tono } from "@/lib/estados";

/** Colores de la cuadrícula y las barras por tono de estado (paleta del prototipo). */
export const TONO_TARJETA: Record<Tono, string> = {
  ok: "border-verde/25 bg-verde-claro/45 hover:border-verde",
  info: "border-info/25 bg-info-claro/70 hover:border-info",
  alerta: "border-alerta/25 bg-alerta-claro/70 hover:border-alerta",
  error: "border-error/25 bg-error-claro/80 hover:border-error",
  dorado: "border-dorado/30 bg-dorado-claro hover:border-dorado",
  neutro: "border-variante bg-white hover:border-outline",
};

export const TONO_ICONO: Record<Tono, string> = {
  ok: "text-verde",
  info: "text-info",
  alerta: "text-alerta",
  error: "text-error",
  dorado: "text-dorado-texto",
  neutro: "text-sobre-variante",
};

export const TONO_BARRA: Record<Tono, string> = {
  ok: "bg-verde",
  info: "bg-info",
  alerta: "bg-alerta",
  error: "bg-error",
  dorado: "bg-dorado",
  neutro: "bg-outline",
};
