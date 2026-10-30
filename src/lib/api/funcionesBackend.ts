/**
 * Funciones del frontend que dependen de endpoints que el backend todavía no
 * tiene (ver docs/MIGRACION.md, sección 7).
 *
 * Mientras una bandera esté en `false`, la pantalla se muestra con el aviso
 * "Pendiente de backend", no se hacen peticiones y los botones que la usan
 * quedan deshabilitados. Cuando el endpoint exista, basta con cambiarla a `true`.
 */
export const FUNCIONES_BACKEND = {
  /** GET/PUT /api/notificaciones... */
  notificaciones: false,
  /** GET /mis-reservas, PUT /mis-reservas/{id}/cancelar y /modificar. */
  misReservas: false,
  /** POST /admin/solicitar-cambio y PUT /solicitudes-cambio/{id}/responder. */
  solicitudesCambio: false,
} as const;

export type FuncionBackend = keyof typeof FUNCIONES_BACKEND;
