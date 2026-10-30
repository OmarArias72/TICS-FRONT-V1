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

// Las utilidades de fecha viven en lib/fechas.ts; se reexportan para no
// romper los imports existentes de Inventario.
export { formatearFecha, hoyISO } from "./fechas";
