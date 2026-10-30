/**
 * Clases de Tailwind compartidas por los formularios.
 * Se centralizan para que todos los campos tengan el mismo aspecto y foco.
 */

export const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-sobre-variante";

export const inputClass =
  "w-full rounded-xl border border-outline/40 bg-white px-3 py-2.5 text-sm text-sobre-superficie " +
  "outline-none transition-all placeholder:text-outline " +
  "focus:border-verde focus:ring-2 focus:ring-verde/20";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-verde px-4 py-3 text-sm font-semibold text-white " +
  "shadow-md shadow-verde/20 transition-colors hover:bg-verde-hover " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-outline/40 bg-white px-4 py-3 text-sm " +
  "font-semibold text-sobre-variante transition-colors hover:bg-variante " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-verde focus-visible:ring-offset-2";

/** Tarjeta centrada usada por login, registro y páginas de error. */
export const cardClass =
  "w-full rounded-2xl border border-variante bg-white p-8 shadow-xl shadow-verde-oscuro/5";
