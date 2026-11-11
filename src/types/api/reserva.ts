import type { HoraMinutos, IsoDate, IsoDateTime, ValorConocido } from "./common";

/**
 * Contratos de reservas de salas (ReservaSalasController, `/api/reservas-salas`),
 * backend v4.1. Ningún endpoint recibe `idUsuario` ni `idAdmin`: el usuario
 * sale de la sesión.
 */

/** Estado de un uso de sala (columna `uso_salas.estado`). */
export type EstadoUsoSala = ValorConocido<"Reservada" | "Confirmada" | "Cancelada" | "Reasignada">;

/** Estado de una solicitud extraordinaria (columna `solicitudes_reserva.estado`). */
export type EstadoSolicitudReserva = ValorConocido<"Pendiente" | "Aprobada" | "Rechazada">;

/** Estado de una solicitud de cambio del Admin/Operador al profesor. */
export type EstadoSolicitudCambio = ValorConocido<"Pendiente" | "Aceptada" | "Rechazada" | "Aplicada" | "Expirada">;

/** SolicitudCambioResponseDTO. */
export interface SolicitudCambio {
  idSolicitudCambio: number;
  idUso: number;
  idAdmin: number;
  /** Quien pidió el cambio. */
  admin: string;
  mensaje: string;
  estado: EstadoSolicitudCambio;
  /** Respuesta del profesor (obligatoria si rechaza). */
  respuesta: string | null;
  fechaCreacion: IsoDateTime;
  fechaRespuesta: IsoDateTime | null;
  profesor: string;
  codigoSala: string;
  fecha: IsoDate;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
}

/** UsoSalaResponseDTO: una reserva en la agenda o en "mis reservas". */
export interface UsoSala {
  idUso: number;
  idSala: number;
  codigoSala: string;
  nombreSala: string | null;
  idUsuario: number;
  /** Nombre a mostrar: el profesor sin cuenta si lo hay; si no, el dueño de la reserva. */
  profesor: string;
  /** Profesor sin cuenta para quien el Admin registró la reserva (la reserva es del Admin). */
  profesorExterno: string | null;
  /** Dueño de la reserva en el sistema (en las de profesor sin cuenta, el Admin que la registró). */
  registradaPor: string;
  fecha: IsoDate;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
  fechaInicio: IsoDateTime;
  fechaFin: IsoDateTime;
  proposito: string | null;
  estado: EstadoUsoSala;
  motivoCancelacion: string | null;
  idSolicitudRelacionada: number | null;
  /** Nombre de quien reasignó o canceló desde el control de reservas. */
  adminModifico: string | null;
  fechaRegistro: IsoDateTime | null;
  /** Solicitud de cambio vigente (Pendiente o Aceptada) o null. */
  solicitudCambio: SolicitudCambio | null;
  /** true si no está cancelada y es a partir de mañana. */
  editablePorProfesor: boolean;
}

/** SolicitudReservaResponseDTO: solicitud extraordinaria. */
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
  fechaInicio: IsoDateTime | null;
  fechaFin: IsoDateTime | null;
  justificacion: string | null;
  estado: EstadoSolicitudReserva;
  motivoRechazo: string | null;
  adminAtendio: string | null;
  idUsoGenerado: number | null;
  fechaSolicitud: IsoDateTime | null;
}

/** ReservaDirectaRequest. No en el pasado, a 30 días o menos (salvo Admin), sin empalme. */
export interface ReservaDirectaRequest {
  idSala: number;
  fecha: IsoDate;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
  proposito: string;
  /** Solo Admin: reserva a nombre de un profesor que no tiene cuenta (opcional). */
  profesorExterno?: string | null;
}

/** SolicitudExtraRequest. */
export interface SolicitudExtraRequest {
  idSala: number;
  fecha: IsoDate;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
  justificacion: string;
}

/** AprobarSolicitudRequest. Sala y horario son obligatorios (pueden ajustarse). */
export interface AprobarSolicitudRequest {
  idSolicitud: number;
  idSalaDestino: number;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
}

/** RechazarSolicitudRequest (reservas). */
export interface RechazarSolicitudReservaRequest {
  idSolicitud: number;
  motivoRechazo: string;
}

/** ReasignarReservaRequest. Sin `fecha` conserva la actual. */
export interface ReasignarReservaRequest {
  idUso: number;
  idSalaDestino: number;
  fecha?: IsoDate | null;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
}

/** CancelarReservaRequest (control de reservas). */
export interface CancelarReservaRequest {
  idUso: number;
  motivoCancelacion: string;
}

/** SolicitarCambioRequest: una vigente por reserva, no el mismo día. */
export interface SolicitarCambioRequest {
  idUso: number;
  mensaje: string;
}

/** ResponderCambioRequest. Rechazar exige `respuesta`. */
export interface ResponderCambioRequest {
  acepta: boolean;
  respuesta?: string | null;
}

/** CancelarMiReservaRequest: solo el dueño, hasta el día anterior. */
export interface CancelarMiReservaRequest {
  motivoCancelacion: string;
}

/**
 * EditarReservaAdminRequest (`PUT /mis-reservas/{idUso}/editar`, solo Admin): cambio directo de una
 * reserva propia, sin solicitud de cambio ni límite del día anterior. `profesorExterno` vacío = a
 * nombre del propio Admin. Errores: EMPALME, RESERVA_TERMINADA, VALIDACION.
 */
export interface EditarReservaAdminRequest {
  idSalaDestino: number;
  fecha: IsoDate;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
  proposito: string | null;
  profesorExterno: string | null;
}

/** ModificarMiReservaRequest: exige una solicitud de cambio Aceptada de esa reserva. */
export interface ModificarMiReservaRequest {
  idSolicitudCambio: number;
  idSalaDestino: number;
  fecha: IsoDate;
  horaInicio: HoraMinutos;
  horaFin: HoraMinutos;
}

/* ==================== Configuración del módulo ==================== */

/** ConfiguracionModuloDTO (`/api/configuracion/modulos/RESERVAS`). */
export interface ConfiguracionModulo {
  clave: string;
  habilitado: boolean;
  fechaInicio: IsoDate | null;
  fechaFin: IsoDate | null;
  /** Aviso que ve el profesor cuando el módulo no está disponible. */
  mensaje: string | null;
  /** habilitado y hoy dentro del periodo. */
  disponible: boolean;
  actualizadoPor: string | null;
  fechaActualizacion: IsoDateTime | null;
}

/** ActualizarRequest del módulo (solo Admin). */
export interface ConfiguracionModuloRequest {
  habilitado: boolean;
  fechaInicio?: IsoDate | null;
  fechaFin?: IsoDate | null;
  mensaje?: string | null;
}
