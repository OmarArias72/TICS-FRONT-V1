import type { HoraMinutos, IsoDate, IsoDateTime, ValorConocido } from "./common";

/**
 * Contratos de reservas de salas (ReservaSalasController, `/api/reservas-salas`).
 *
 * Importante: los métodos mapTo...DTO de ReservaSalasService NO llenan todos
 * los campos que declaran los DTO. Los campos marcados como "no se envía hoy"
 * siempre llegan en null; el frontend no debe depender de ellos hasta que el
 * backend los complete (pendiente en docs/MIGRACION.md).
 */

/** Estado de un uso de sala (columna `uso_sala.estado`). */
export type EstadoUsoSala = ValorConocido<"Confirmada" | "Cancelada" | "Reservada">;

/** Estado de una solicitud extraordinaria (columna `solicitud_reserva.estado`). */
export type EstadoSolicitudReserva = ValorConocido<"Pendiente" | "Aprobada" | "Rechazada">;

/** UsoSalaResponseDTO: una reserva confirmada o cancelada en la agenda. */
export interface UsoSala {
  idUso: number;
  idSala: number;
  codigoSala: string;
  nombreSala: string | null;
  profesor: string;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
  proposito: string | null;
  estado: EstadoUsoSala;
  fechaRegistro: IsoDateTime | null;
  /** No se envía hoy. La agenda ya viene filtrada por la fecha consultada. */
  fecha?: IsoDate | null;
  /** No se envía hoy. */
  idUsuario?: number | null;
  /** No se envía hoy. */
  fechaInicio?: IsoDateTime | null;
  /** No se envía hoy. */
  fechaFin?: IsoDateTime | null;
  /** No se envía hoy. */
  motivoCancelacion?: string | null;
  /** No se envía hoy. */
  idSolicitudRelacionada?: number | null;
  /** No se envía hoy. */
  adminModifico?: string | null;
}

/** SolicitudReservaResponseDTO: solicitud fuera del horario de reserva directa. */
export interface SolicitudReserva {
  idSolicitud: number;
  idSala: number;
  codigoSala: string;
  nombreSala: string | null;
  profesor: string;
  fecha: IsoDate;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
  justificacion: string | null;
  estado: EstadoSolicitudReserva;
  /** No se envía hoy: el solicitante no puede ver el motivo del rechazo. */
  motivoRechazo?: string | null;
  /** No se envía hoy. */
  adminAtendio?: string | null;
  /** No se envía hoy. */
  fechaSolicitud?: IsoDateTime | null;
  /** No se envía hoy. */
  idSolicitante?: number | null;
  /** No se envía hoy. */
  idUsoGenerado?: number | null;
  /** No se envía hoy. */
  fechaInicio?: IsoDateTime | null;
  /** No se envía hoy. */
  fechaFin?: IsoDateTime | null;
}

/** ReservaDirectaRequest. */
export interface ReservaDirectaRequest {
  idSala: number;
  idUsuario: number;
  fecha: IsoDate;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
  proposito: string;
}

/** SolicitudExtraRequest. */
export interface SolicitudExtraRequest {
  idSala: number;
  idUsuario: number;
  fecha: IsoDate;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
  justificacion: string;
}

/** AprobarSolicitudRequest. Sala y horario pueden ajustarse al aprobar. */
export interface AprobarSolicitudRequest {
  idSolicitud: number;
  idAdmin: number;
  idSalaDestino?: number | null;
  horaInicio?: HoraMinutos | null;
  horaFin?: HoraMinutos | null;
}

/** RechazarSolicitudRequest (reservas). */
export interface RechazarSolicitudReservaRequest {
  idSolicitud: number;
  idAdmin: number;
  motivoRechazo: string;
}

/** ReasignarReservaRequest. */
export interface ReasignarReservaRequest {
  idUso: number;
  idAdmin: number;
  idSalaDestino?: number | null;
  fecha?: IsoDate | null;
  horaInicio?: HoraMinutos | null;
  horaFin?: HoraMinutos | null;
}

/** CancelarReservaRequest. */
export interface CancelarReservaRequest {
  idUso: number;
  idAdmin: number;
  motivoCancelacion: string;
}

/* ================================================================
 * Pendiente de backend (docs/MIGRACION.md, sección 7)
 * ================================================================ */

/** Estado de una solicitud de cambio que el admin envía al profesor. */
export type EstadoSolicitudCambio = ValorConocido<
  "Pendiente" | "Aceptada" | "Rechazada" | "Aplicada" | "Expirada"
>;

/** SolicitudCambioResponseDTO: el admin pide al profesor cambiar sala o fecha. */
export interface SolicitudCambioReserva {
  idSolicitudCambio: number;
  idUso: number;
  admin: string;
  mensaje: string;
  estado: EstadoSolicitudCambio;
  respuesta: string | null;
  fechaCreacion: IsoDateTime;
  fechaRespuesta: IsoDateTime | null;
}

/** MiReservaResponseDTO: reserva del profesor con su fecha y el cambio solicitado vigente. */
export interface MiReserva extends UsoSala {
  fecha: IsoDate;
  solicitudCambio: SolicitudCambioReserva | null;
}

/** SolicitarCambioRequest. */
export interface SolicitarCambioRequest {
  idUso: number;
  idAdmin: number;
  mensaje: string;
}

/** ResponderCambioRequest. */
export interface ResponderCambioRequest {
  idUsuario: number;
  acepta: boolean;
  respuesta?: string | null;
}

/** CancelarMiReservaRequest. */
export interface CancelarMiReservaRequest {
  idUsuario: number;
  motivoCancelacion: string;
}

/** ModificarMiReservaRequest: solo con una solicitud de cambio aceptada. */
export interface ModificarMiReservaRequest {
  idUsuario: number;
  idSolicitudCambio: number;
  idSalaDestino: number;
  fecha: IsoDate;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
}
