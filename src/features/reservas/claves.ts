/**
 * Claves de caché de React Query del módulo de reservas. Centralizarlas evita
 * que una pantalla invalide una clave con otro nombre y deje datos viejos.
 */
export const clavesReservas = {
  salas: ["salas"] as const,
  agenda: (idSala?: number, fecha?: string) =>
    idSala === undefined ? (["agenda"] as const) : (["agenda", idSala, fecha] as const),
  misSolicitudes: (idUsuario?: number) => ["mis-solicitudes", idUsuario] as const,
  pendientes: ["solicitudes-pendientes"] as const,
  misReservas: (idUsuario?: number) => ["mis-reservas", idUsuario] as const,
};
