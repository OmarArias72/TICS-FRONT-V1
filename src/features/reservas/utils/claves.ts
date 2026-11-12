/**
 * Claves de caché de React Query del módulo de reservas. Centralizarlas evita
 * que una pantalla invalide una clave con otro nombre y deje datos viejos.
 */
export const clavesReservas = {
  salas: ["salas"] as const,
  agenda: (idSala?: number, fecha?: string) =>
    idSala === undefined ? (["agenda"] as const) : (["agenda", idSala, fecha] as const),
  /**
   * Sin argumento devuelven solo el prefijo (["mis-reservas"]) para invalidar la lista de
   * cualquier usuario. Antes devolvían ["mis-reservas", undefined], que React Query no
   * empareja con ["mis-reservas", 5]: aceptar un cambio no refrescaba la pantalla.
   */
  misSolicitudes: (idUsuario?: number) =>
    idUsuario === undefined ? (["mis-solicitudes"] as const) : (["mis-solicitudes", idUsuario] as const),
  pendientes: ["solicitudes-pendientes"] as const,
  misReservas: (idUsuario?: number) =>
    idUsuario === undefined ? (["mis-reservas"] as const) : (["mis-reservas", idUsuario] as const),
  /** Sin argumento: prefijo para invalidar todas las listas de solicitudes de cambio. */
  solicitudesCambio: (estado?: string) =>
    estado === undefined ? (["solicitudes-cambio"] as const) : (["solicitudes-cambio", estado] as const),
  /** Estado del módulo de reservas (Apertura / Cierre de agenda). */
  modulo: ["configuracion-modulo", "RESERVAS"] as const,
};
