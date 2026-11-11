/**
 * Funciones del frontend que dependen de endpoints nuevos del backend
 * (ver docs/MIGRACION.md, sección 7).
 *
 * Con una bandera en `false`, la pantalla muestra "Pendiente de backend", no
 * hace peticiones y deshabilita sus botones. Desde el backend v4.1 (fase 2)
 * las tres están disponibles; se conservan para poder apagar una función si
 * se despliega el frontend contra un backend anterior.
 */
export const FUNCIONES_BACKEND = {
  /** GET/PUT /api/notificaciones... */
  notificaciones: true,
  /** GET /mis-reservas, PUT /mis-reservas/{id}/cancelar y /modificar. */
  misReservas: true,
  /** POST /admin/solicitar-cambio y PUT /solicitudes-cambio/{id}/responder. */
  solicitudesCambio: true,
} as const;

export type FuncionBackend = keyof typeof FUNCIONES_BACKEND;
