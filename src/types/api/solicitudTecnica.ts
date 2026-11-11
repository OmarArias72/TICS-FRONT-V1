import type { IsoDateTime, ValorConocido } from "./common";

/**
 * Contratos de la mesa de ayuda (SolicitudTecnicaController y
 * CatalogoTipoSolicitudController, `/api/solicitudes-tecnicas`), backend v4.1.
 * El solicitante y quien atiende salen de la sesión.
 */

/**
 * Enum `EstadoSolicitud` del backend. Flujo principal:
 * PENDIENTE -> APROBADA -> FORMULARIO_ENVIADO -> ESPERA_TICKET
 * -> TICKET_CREADO -> CERRADA. Ramas: RECHAZADA (puede reenviarse) y CANCELADA.
 * RESUELTO sigue en el enum pero no se usa.
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
 * Filtro de `GET /admin/panel`.
 * - PENDIENTES: solo PENDIENTE.
 * - SIN_ID: APROBADA, FORMULARIO_ENVIADO y ESPERA_TICKET.
 * - TICKET_CREADO: con ticket, esperando resolución.
 */
export type FiltroPanelAdmin = "PENDIENTES" | "SIN_ID" | "TICKET_CREADO" | "EXTERNAS" | "TODAS";

/**
 * SISTEMA: la creó un usuario registrado. EXTERNA: la abrió TIC para alguien sin
 * acceso a su correo institucional (no tiene cuenta: `idUsuario` es null y el
 * correo es el alterno). Ver CAMBIOS-FRONTEND-SOLICITUD-EXTERNA.md del backend.
 */
export type OrigenSolicitud = ValorConocido<"SISTEMA" | "EXTERNA">;

/** CatalogoTipoSolicitudDTO. */
export interface TipoSolicitud {
  idTipo: number;
  /** Clave del tipo, por ejemplo "REINICIO_PASSWORD" u "OTRO". */
  nombre: ValorConocido<"REINICIO_PASSWORD" | "REINICIO_AUTHENTICATOR" | "OTRO">;
  descripcion: string | null;
}

/**
 * FormularioDetalleDTO. La CURP llega enmascarada; la completa solo la ve el
 * personal TIC con `GET /admin/{id}/curp` (queda en la auditoría).
 */
export interface FormularioDetalle {
  idFormulario: number;
  nombreCompleto: string;
  correoInstitucional: string;
  correoAlterno: string | null;
  numeroCuenta: string;
  curpEnmascarada: string | null;
  telefono: string | null;
  descripcionProblema: string | null;
}

/** Origen de una actualización del ticket. */
export type OrigenActualizacion = ValorConocido<"MANUAL" | "CORREO">;

/** ActualizacionTicketDTO: seguimiento manual o un correo leído del buzón. */
/** Evento de ServiceDesk que originó un correo o una actualización. */
export type EventoCorreo = ValorConocido<"CREADO" | "ACTUALIZADO" | "RESUELTO" | "CERRADO" | "OTRO">;

export interface ActualizacionTicket {
  idActualizacion: number;
  origen: OrigenActualizacion;
  /** Solo en las que vinieron de un correo de la plataforma. */
  evento: EventoCorreo | null;
  descripcion: string;
  correoAsunto: string | null;
  usuario: string | null;
  fecha: IsoDateTime;
}

/** TicketExternoDTO. */
export interface TicketExterno {
  idTicket: number;
  codigoTicketCreado: string | null;
  codigoTicketResuelto: string | null;
  /** Título del ticket en ServiceDesk ("CUUT - REESTABLECIMIENTO DEL METODO DE AUTENTICACION"). */
  tituloTicket: string | null;
  /** true si el ticket se asoció solo con el correo de creación de la plataforma. */
  asociadoPorCorreo: boolean;
  fechaCreacionTicket: IsoDateTime | null;
  fechaResolucionTicket: IsoDateTime | null;
  capturadoPorNombre: string | null;
  actualizaciones: ActualizacionTicket[] | null;
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
  /** null en las solicitudes externas (la persona no tiene cuenta). */
  idUsuario: number | null;
  /** En las externas: el nombre y el correo alterno que capturó TIC. */
  nombreUsuario: string;
  correoUsuario: string;
  origen: OrigenSolicitud;
  externa: boolean;
  /** Solo externas: quién de TIC la abrió. */
  creadoPorNombre: string | null;
  /** Solo externas: último envío del enlace del formulario. */
  enlaceEnviado: IsoDateTime | null;
  /** Solo externas en APROBADA: cuándo vence el enlace (se rechaza sola si no llenan el formulario). */
  enlaceExpira: IsoDateTime | null;
  idTipo: number;
  tipoNombre: TipoSolicitud["nombre"];
  motivo: string | null;
  estado: EstadoSolicitudTecnica;
  motivoRechazo: string | null;
  fechaSolicitud: IsoDateTime;
  fechaRevision: IsoDateTime | null;
  revisorNombre: string | null;
  /** Quien tomó la solicitud para generar el ticket (bloqueo de 10 min). */
  idOperadorAtendiendo: number | null;
  atendidoPor: string | null;
  bloqueoHasta: IsoDateTime | null;
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
 * LlenarFormularioRequest. Todos los campos son obligatorios. Validaciones
 * del backend: cuenta de 7 dígitos, teléfono de 10, correo institucional con
 * dominio permitido, correo alterno distinto y CURP oficial (se normaliza a
 * mayúsculas). La CURP se envía completa en cada guardado.
 */
export interface LlenarFormularioRequest {
  nombreCompleto: string;
  correoInstitucional: string;
  correoAlterno: string;
  numeroCuenta: string;
  curp: string;
  telefono: string;
  descripcionProblema: string;
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
  comentario?: string | null;
}

/** CurpDTO: CURP completa para el personal TIC. */
export interface CurpSolicitud {
  idSolicitud: number;
  curp: string;
}

/** ProcesarCorreoRequest: pegar un correo de la plataforma para registrarlo. */
export interface ProcesarCorreoRequest {
  asunto: string;
  cuerpo?: string | null;
  messageId?: string | null;
}

/** Resultado de leer un correo de la plataforma de tickets. */
/**
 * REGISTRADO: aplicado a una solicitud · SIN_ASOCIAR: trae ID de ticket que ninguna solicitud tiene ·
 * SIN_TICKET: no trae ID · DUPLICADO · IGNORADO: descartado a mano · ERROR.
 */
export type ResultadoCorreo = ValorConocido<"REGISTRADO" | "SIN_ASOCIAR" | "SIN_TICKET" | "DUPLICADO" | "IGNORADO" | "ERROR">;

/** ResultadoCorreoDTO de `POST /admin/correo/procesar`. */
export interface ResultadoProcesarCorreo {
  procesado: boolean;
  resultado: ResultadoCorreo;
  evento: EventoCorreo | null;
  codigoTicket: string | null;
  tituloTicket: string | null;
  idSolicitud: number | null;
  /** Qué se hizo solo: ASOCIADO (ticket asignado a la solicitud) o RESUELTO (solicitud cerrada). */
  accion: ValorConocido<"ASOCIADO" | "RESUELTO"> | null;
  /** El correo parece de resolución: sugerir "Resolver ticket". */
  pareceResolucion: boolean;
  mensaje: string;
}

/** CorreoBuzonDTO: un correo leído automáticamente del buzón de TIC. */
export interface CorreoBuzon {
  idCorreo: number;
  remitente: string | null;
  asunto: string | null;
  fechaCorreo: IsoDateTime | null;
  resultado: ResultadoCorreo;
  evento: EventoCorreo | null;
  codigoTicket: string | null;
  tituloTicket: string | null;
  idSolicitud: number | null;
  detalle: string | null;
  fechaProceso: IsoDateTime;
}

/** EstadoBuzonDTO: configuración y última revisión del lector IMAP. */
export interface EstadoBuzon {
  habilitado: boolean;
  host: string;
  usuario: string;
  carpeta: string;
  autenticacion: ValorConocido<"OAUTH2_MICROSOFT" | "PASSWORD">;
  intervaloMinutos: number;
  ultimaRevision: IsoDateTime | null;
  ultimaRevisionExitosa: IsoDateTime | null;
  correosUltimaRevision: number;
  ultimoError: string | null;
  /** Correos SIN_ASOCIAR esperando que alguien los asocie o descarte. */
  pendientesDeAsociar: number;
}

/* ================= Solicitudes externas ================= */

/** CrearExternaRequest: datos básicos; el resto lo llena la persona desde el enlace. */
export interface CrearSolicitudExternaRequest {
  nombre: string;
  /** Gmail, Outlook...; el backend rechaza los institucionales (CORREO_INSTITUCIONAL). */
  correoAlterno: string;
  idTipo: number;
  motivo: string;
}

/**
 * En qué punto está la solicitud para quien abre el enlace.
 * ESPERA_DATOS y ENVIADO son editables; EN_ATENCION (TIC ya la tomó), RESUELTA,
 * RECHAZADA, CANCELADA y VENCIDO (pasaron las 72 h) solo muestran `mensaje`.
 */
export type EtapaFormularioExterno = ValorConocido<
  "ESPERA_DATOS" | "ENVIADO" | "EN_ATENCION" | "RESUELTA" | "RECHAZADA" | "CANCELADA" | "VENCIDO"
>;

/** Datos ya capturados. La CURP nunca se devuelve: se escribe de nuevo en cada envío. */
export interface DatosPreviosExterno {
  nombreCompleto: string | null;
  correoInstitucional: string | null;
  correoAlterno: string | null;
  numeroCuenta: string | null;
  telefono: string | null;
  descripcionProblema: string | null;
  tieneCurp: boolean;
}

/** FormularioExternoDTO de `/api/publico/formulario-externo`. */
export interface FormularioExterno {
  folio: number;
  /** Nombre legible del tipo (descripción del catálogo). */
  tipo: string;
  motivo: string | null;
  nombre: string;
  etapa: EtapaFormularioExterno;
  editable: boolean;
  /** Solo en ESPERA_DATOS. */
  enlaceExpira: IsoDateTime | null;
  mensaje: string;
  /** Solo si es editable. */
  datos: DatosPreviosExterno | null;
}
