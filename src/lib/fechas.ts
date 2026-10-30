/**
 * Utilidades de fecha y hora en la zona local del navegador.
 *
 * Corrección respecto al original: allí "hoy" se calculaba con
 * `new Date().toISOString()`, que está en UTC; en México, después de las
 * 18:00 devolvía la fecha del día siguiente.
 */

const dosDigitos = (n: number) => String(n).padStart(2, "0");

/** Fecha local en formato YYYY-MM-DD. */
export function aISO(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

/** Hoy (fecha local) en formato YYYY-MM-DD. */
export function hoyISO(): string {
  return aISO(new Date());
}

/** Fecha YYYY-MM-DD desplazada `dias` días (local). */
export function sumarDias(fechaISO: string, dias: number): string {
  const [a, m, d] = fechaISO.split("-").map(Number);
  return aISO(new Date(a, m - 1, d + dias));
}

/** Hora local actual en formato HH:mm. */
export function horaActual(): string {
  const ahora = new Date();
  return `${dosDigitos(ahora.getHours())}:${dosDigitos(ahora.getMinutes())}`;
}

/** Fecha y hora del backend (LocalDateTime ISO) en formato corto: "30 oct 2026". */
export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

/** Fecha YYYY-MM-DD en formato largo: "viernes 30 de octubre". */
export function formatearDia(fechaISO: string): string {
  const [a, m, d] = fechaISO.split("-").map(Number);
  if (!a || !m || !d) return fechaISO;
  return new Date(a, m - 1, d).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
