import type { IsoDateTime, ValorConocido } from "./common";

/**
 * Notificaciones dentro del sistema (endpoint pendiente en el backend:
 * `/api/notificaciones`, ver docs/MIGRACION.md sección 7).
 */
export type TipoNotificacion = ValorConocido<
  | "RESERVA_REASIGNADA"
  | "RESERVA_CANCELADA"
  | "SOLICITUD_APROBADA"
  | "SOLICITUD_RECHAZADA"
  | "CAMBIO_SOLICITADO"
  | "CAMBIO_RESPONDIDO"
  | "RESERVA_MODIFICADA"
  | "SOLICITUD_TECNICA_APROBADA"
  | "SOLICITUD_TECNICA_RECHAZADA"
  | "SOLICITUD_TECNICA_RESUELTA"
>;

export interface Notificacion {
  idNotificacion: number;
  idUsuario: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  /** Ruta del frontend a la que lleva la notificación (por ejemplo, /reservas/mis-reservas). */
  enlace: string | null;
  leida: boolean;
  fechaCreacion: IsoDateTime;
}
