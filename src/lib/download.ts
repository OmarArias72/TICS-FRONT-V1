/**
 * Descarga un Blob como archivo desde el navegador.
 * Solo debe llamarse desde un manejador de eventos (necesita `document`).
 */
export function descargarArchivo(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Se libera la URL temporal después de que el navegador inicia la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Fecha local de hoy en formato YYYY-MM-DD (para nombres de archivo y campos date). */
export function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Fecha y hora del backend (LocalDateTime ISO) en formato corto de México. */
export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}
