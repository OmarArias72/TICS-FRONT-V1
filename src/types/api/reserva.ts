import type { HoraMinutos, IsoDate, IsoDateTime, ValorConocido } from "./common";

/**
 * Contratos de reservas de salas (ReservaSalasController, `/api/reservas-salas`).
 */

/** Estado de un uso de sala (columna `uso_sala.estado`). */
export type EstadoUsoSala = ValorConocido<"Confirmada" | "Cancelada">;

/** Estado de una solicitud extraordinaria (columna `solicitud_reserva.estado`). */
export type EstadoSolicitudReserva = ValorConocido<"Pendiente" | "Aprobada" | "Rechazada">;

/** UsoSalaResponseDTO: una reserva confirmada o cancelada en la agenda. */
export interface UsoSala {
  idUso: number;
  idSala: number;
  codigoSala: string;
  nombreSala: string | null;
  idUsuario: number;
  profesor: string;
  fecha: IsoDate;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
  fechaInicio: IsoDateTime;
  fechaFin: IsoDateTime;
  proposito: string | null;
  estado: EstadoUsoSala;
  motivoCancelacion: string | null;
  idSolicitudRelacionada: number | null;
  adminModifico: string | null;
  fechaRegistro: IsoDateTime | null;
}

/** SolicitudReservaResponseDTO: solicitud fuera del horario de reserva directa. */
export interface SolicitudReserva {
  idSolicitud: number;
  idSala: number;
  codigoSala: string;
  nombreSala: string | null;
  idSolicitante: number;
  profesor: string;
  fecha: IsoDate;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
  fechaInicio: IsoDateTime;
  fechaFin: IsoDateTime;
  justificacion: string | null;
  estado: EstadoSolicitudReserva;
  motivoRechazo: string | null;
  adminAtendio: string | null;
  idUsoGenerado: number | null;
  fechaSolicitud: IsoDateTime | null;
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
