import type { IsoDateTime, ValorConocido } from "./common";

/** Tipos de `TipoNotificacion` (mismo CHECK en la BD), backend v4.1. */
export type TipoNotificacion = ValorConocido<
  // Profesor (reservas)
  | "RESERVA_REASIGNADA"
  | "RESERVA_CANCELADA"
  | "SOLICITUD_APROBADA"
  | "SOLICITUD_RECHAZADA"
  | "CAMBIO_SOLICITADO"
  // Admin / Operador (reservas)
  | "CAMBIO_RESPONDIDO"
  | "RESERVA_MODIFICADA"
  | "RESERVA_CANCELADA_PROFESOR"
  | "SOLICITUD_RESERVA_NUEVA"
  // Solicitante (mesa de ayuda)
  | "SOLICITUD_TECNICA_APROBADA"
  | "SOLICITUD_TECNICA_RECHAZADA"
  | "SOLICITUD_TECNICA_RESUELTA"
  | "TICKET_CREADO"
  | "TICKET_ACTUALIZADO"
  // Admin / Operador (mesa de ayuda)
  | "SOLICITUD_TECNICA_NUEVA"
  | "SOLICITUD_TECNICA_LISTA"
  | "CORREO_SIN_TICKET"
>;

/** NotificacionDTO. `titulo` y `mensaje` vienen listos para mostrar. */
export interface Notificacion {
  idNotificacion: number;
  idUsuario: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  /** Ruta del frontend a la que lleva el clic. */
  enlace: string | null;
  leida: boolean;
  fechaCreacion: IsoDateTime;
}

/** Respuesta de `GET /api/notificaciones`. */
export interface BandejaNotificaciones {
  noLeidas: number;
  notificaciones: Notificacion[];
}
