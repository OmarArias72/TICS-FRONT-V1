import type { IsoDateTime, ValorConocido } from "./common";

/**
 * Contratos de la mesa de ayuda (SolicitudTecnicaController y
 * CatalogoTipoSolicitudController, `/api/solicitudes-tecnicas`).
 */

/**
 * Enum `EstadoSolicitud` del backend. Flujo principal:
 * PENDIENTE -> APROBADA -> FORMULARIO_ENVIADO -> ESPERA_TICKET
 * -> TICKET_CREADO -> CERRADA. Ramas: RECHAZADA (puede reenviarse) y CANCELADA.
 */
export type EstadoSolicitudTecnica =
  | "PENDIENTE"
  | "RECHAZADA"
  | "APROBADA"
  | "FORMULARIO_ENVIADO"
  | "ESPERA_TICKET"
  | "TICKET_CREADO"
  | "RESUELTO"
  | "CANCELADA"
  | "CERRADA";

/**
 * Filtro de `GET /admin/panel`. Cualquier otro valor equivale a TODAS.
 * - PENDIENTES: solo PENDIENTE.
 * - SIN_ID: APROBADA, FORMULARIO_ENVIADO y ESPERA_TICKET.
 */
export type FiltroPanelAdmin = "PENDIENTES" | "SIN_ID" | "TODAS";

/** CatalogoTipoSolicitudDTO. */
export interface TipoSolicitud {
  idTipo: number;
  /** Clave del tipo, por ejemplo "REINICIO_PASSWORD" u "OTRO". */
  nombre: ValorConocido<"REINICIO_PASSWORD" | "REINICIO_AUTHENTICATOR" | "OTRO">;
  descripcion: string | null;
}

/** FormularioDetalleDTO. La CURP llega descifrada para el personal de TICS. */
export interface FormularioDetalle {
  idFormulario: number;
  nombreCompleto: string;
  correoInstitucional: string;
  correoAlterno: string | null;
  numeroCuenta: string;
  curp: string | null;
  telefono: string | null;
  descripcionProblema: string | null;
}

/** TicketExternoDTO. */
export interface TicketExterno {
  codigoTicketCreado: string | null;
  codigoTicketResuelto: string | null;
  fechaCreacionTicket: IsoDateTime | null;
  fechaResolucionTicket: IsoDateTime | null;
  capturadoPorNombre: string | null;
}

/** HistorialSolicitudDTO. */
export interface HistorialSolicitud {
  idHistorial: number;
  estadoAnterior: EstadoSolicitudTecnica | null;
  estadoNuevo: EstadoSolicitudTecnica;
  comentario: string | null;
  fechaCambio: IsoDateTime;
  usuarioAccionNombre: string;
}

/**
 * SolicitudTecnicaResponseDTO. El panel de administración no incluye
 * `historial` (el backend lo omite al listar), por eso es opcional.
 */
export interface SolicitudTecnica {
  idSolicitud: number;
  nombreUsuario: string;
  correoUsuario: string;
  tipoNombre: TipoSolicitud["nombre"];
  motivo: string | null;
  estado: EstadoSolicitudTecnica;
  motivoRechazo: string | null;
  fechaSolicitud: IsoDateTime;
  fechaRevision: IsoDateTime | null;
  revisorNombre: string | null;
  formulario: FormularioDetalle | null;
  ticket: TicketExterno | null;
  historial?: HistorialSolicitud[] | null;
}

/** CrearSolicitudRequest. `motivo` es obligatorio cuando el tipo es "OTRO". */
export interface CrearSolicitudRequest {
  idTipo: number;
  motivo?: string | null;
}

/**
 * LlenarFormularioRequest. Validaciones del backend:
 * - numeroCuenta: exactamente 7 dígitos.
 * - correoInstitucional: termina en "@uaemex.mx".
 * - curp: formato oficial de 18 caracteres en mayúsculas.
 */
export interface LlenarFormularioRequest {
  nombreCompleto: string;
  correoInstitucional: string;
  correoAlterno?: string | null;
  numeroCuenta: string;
  curp: string;
  telefono?: string | null;
  descripcionProblema?: string | null;
}

/** RechazarSolicitudRequest (mesa de ayuda). */
export interface RechazarSolicitudTecnicaRequest {
  motivoRechazo: string;
}

/** CapturarTicketRequest. */
export interface CapturarTicketRequest {
  codigoTicketCreado: string;
}

/** ResolverTicketRequest. */
export interface ResolverTicketRequest {
  codigoTicketResuelto: string;
}
