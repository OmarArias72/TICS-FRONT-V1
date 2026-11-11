import { apiClient } from "../client";
import { request } from "../errors";
import type {
  CorreoBuzon,
  CrearSolicitudExternaRequest,
  CrearSolicitudRequest,
  CurpSolicitud,
  EstadoBuzon,
  FiltroPanelAdmin,
  FormularioExterno,
  LlenarFormularioRequest,
  ProcesarCorreoRequest,
  ResultadoCorreo,
  ResultadoProcesarCorreo,
  SolicitudTecnica,
  TipoSolicitud,
} from "@/types/api";

const BASE = "/solicitudes-tecnicas";

/**
 * Endpoints de la mesa de ayuda (backend v4.1). El solicitante y el personal
 * TIC salen de la sesión; ya no se envían `idUsuario` ni `idAdmin`.
 */
export const solicitudTecnicaService = {
  /* ============ Catálogos ============ */

  obtenerTipos: () =>
    request(
      async () => (await apiClient.get<TipoSolicitud[]>(`${BASE}/catalogos/tipos`)).data,
      "Error al obtener los tipos de solicitud",
    ),

  /* ============ Solicitante (Estudiante y Profesor) ============ */

  /** Con historial y actualizaciones del ticket. */
  misSolicitudes: () =>
    request(
      async () => (await apiClient.get<SolicitudTecnica[]>(`${BASE}/mis-solicitudes`)).data,
      "Error al obtener tus solicitudes",
    ),

  /**
   * POST /crear. Límites del backend: 3 activas (LIMITE_ACTIVAS), 8 h entre
   * solicitudes del mismo tipo (ESPERA_ENTRE_SOLICITUDES) y 5 por hora.
   */
  crearSolicitud: (payload: CrearSolicitudRequest, recaptcha?: string | null) =>
    request(
      async () =>
        (
          await apiClient.post<SolicitudTecnica>(`${BASE}/crear`, payload, {
            headers: recaptcha ? { "X-Recaptcha-Token": recaptcha } : undefined,
          })
        ).data,
      "Error al crear la solicitud",
    ),

  /** Solo para solicitudes RECHAZADAS: vuelven a PENDIENTE con el nuevo motivo. */
  reenviarSolicitud: (idSolicitud: number, payload: { motivo: string }) =>
    request(
      async () => (await apiClient.put<SolicitudTecnica>(`${BASE}/${idSolicitud}/reenviar`, payload)).data,
      "Error al reenviar",
    ),

  llenarFormulario: (idSolicitud: number, payload: LlenarFormularioRequest) =>
    request(
      async () => (await apiClient.put<SolicitudTecnica>(`${BASE}/${idSolicitud}/formulario`, payload)).data,
      "Error al guardar el formulario",
    ),

  cancelarSolicitud: (idSolicitud: number) =>
    request(
      async () => (await apiClient.put<SolicitudTecnica>(`${BASE}/${idSolicitud}/cancelar`)).data,
      "Error al cancelar",
    ),

  /* ============ Administración / Operador ============ */

  panelAdmin: (filtro: FiltroPanelAdmin) =>
    request(
      async () => (await apiClient.get<SolicitudTecnica[]>(`${BASE}/admin/panel`, { params: { filtro } })).data,
      "Error al obtener el panel de solicitudes",
    ),

  /** Detalle con historial y actualizaciones del ticket. */
  detalleAdmin: (idSolicitud: number) =>
    request(
      async () => (await apiClient.get<SolicitudTecnica>(`${BASE}/admin/${idSolicitud}`)).data,
      "Error al obtener la solicitud",
    ),

  /** CURP completa; la consulta queda en la auditoría. */
  obtenerCurp: (idSolicitud: number) =>
    request(
      async () => (await apiClient.get<CurpSolicitud>(`${BASE}/admin/${idSolicitud}/curp`)).data,
      "Error al obtener la CURP",
    ),

  aprobarSolicitud: (idSolicitud: number) =>
    request(
      async () => (await apiClient.post<SolicitudTecnica>(`${BASE}/admin/${idSolicitud}/aprobar`)).data,
      "Error al aprobar la solicitud",
    ),

  rechazarSolicitud: (idSolicitud: number, motivoRechazo: string) =>
    request(
      async () =>
        (await apiClient.post<SolicitudTecnica>(`${BASE}/admin/${idSolicitud}/rechazar`, { motivoRechazo })).data,
      "Error al rechazar la solicitud",
    ),

  /** Toma la solicitud para generar el ticket (bloqueo de 10 min; EN_ATENCION si otro la tiene). */
  bloquearSolicitud: (idSolicitud: number) =>
    request(
      async () => (await apiClient.post<SolicitudTecnica>(`${BASE}/admin/${idSolicitud}/bloquear`)).data,
      "No se pudo tomar la solicitud",
    ),

  /** Suelta una solicitud tomada para que otra persona la atienda. */
  liberarSolicitud: (idSolicitud: number) =>
    request(
      async () => (await apiClient.post<SolicitudTecnica>(`${BASE}/admin/${idSolicitud}/liberar`)).data,
      "No se pudo liberar la solicitud",
    ),

  capturarTicket: (idSolicitud: number, codigoTicketCreado: string) =>
    request(
      async () =>
        (await apiClient.post<SolicitudTecnica>(`${BASE}/admin/${idSolicitud}/capturar-ticket`, { codigoTicketCreado }))
          .data,
      "Error al capturar el ticket",
    ),

  /** Seguimiento manual del ticket; el solicitante lo ve y recibe un aviso. */
  agregarActualizacion: (idSolicitud: number, descripcion: string) =>
    request(
      async () =>
        (await apiClient.post<SolicitudTecnica>(`${BASE}/admin/${idSolicitud}/actualizaciones`, { descripcion })).data,
      "Error al registrar la actualización",
    ),

  resolverTicket: (idSolicitud: number, codigoTicketResuelto: string, comentario?: string | null) =>
    request(
      async () =>
        (
          await apiClient.post<SolicitudTecnica>(`${BASE}/admin/${idSolicitud}/resolver-ticket`, {
            codigoTicketResuelto,
            comentario: comentario || null,
          })
        ).data,
      "Error al resolver el ticket",
    ),

  /** Detecta el ID del ticket en un correo pegado y lo registra como actualización. */
  procesarCorreo: (payload: ProcesarCorreoRequest) =>
    request(
      async () => (await apiClient.post<ResultadoProcesarCorreo>(`${BASE}/admin/correo/procesar`, payload)).data,
      "Error al procesar el correo",
    ),

  /* ============ Solicitudes externas (persona sin acceso a su correo institucional) ============ */

  /**
   * Abre la solicitud (queda APROBADA) y envía al correo alterno el enlace del formulario (72 h).
   * Errores: CORREO_INSTITUCIONAL, VALIDACION.
   */
  crearExterna: (payload: CrearSolicitudExternaRequest) =>
    request(
      async () => (await apiClient.post<SolicitudTecnica>(`${BASE}/admin/externas`, payload)).data,
      "Error al abrir la solicitud externa",
    ),

  /**
   * Envía un enlace nuevo (el anterior deja de servir) con otras 72 h. Desde APROBADA o RECHAZADA
   * (la reabre). `correoAlterno` opcional para corregirlo. Errores: ESPERA_REENVIO, ENLACE_NO_REENVIABLE.
   */
  reenviarEnlace: (idSolicitud: number, correoAlterno?: string | null) =>
    request(
      async () =>
        (
          await apiClient.post<SolicitudTecnica>(`${BASE}/admin/${idSolicitud}/reenviar-enlace`, {
            correoAlterno: correoAlterno || null,
          })
        ).data,
      "Error al reenviar el enlace",
    ),

  /** Rechaza una externa antes del ticket; la persona recibe el motivo por correo. */
  rechazarExterna: (idSolicitud: number, motivo: string) =>
    request(
      async () => (await apiClient.post<SolicitudTecnica>(`${BASE}/admin/${idSolicitud}/rechazar-externa`, { motivo })).data,
      "Error al rechazar la solicitud",
    ),

  /* ============ Formulario externo (público, desde el enlace del correo) ============ */

  /** ENLACE_INVALIDO si el token no existe o fue reemplazado por uno más reciente. */
  consultarFormularioExterno: (token: string) =>
    request(
      async () => (await apiClient.post<FormularioExterno>("/publico/formulario-externo/consultar", { token })).data,
      "No se pudo abrir el formulario",
    ),

  /** Errores: ENLACE_EXPIRADO, FORMULARIO_NO_EDITABLE, ENLACE_INVALIDO, VALIDACION (+ detalles por campo). */
  llenarFormularioExterno: (token: string, formulario: LlenarFormularioRequest) =>
    request(
      async () =>
        (await apiClient.put<FormularioExterno>("/publico/formulario-externo", { token, formulario })).data,
      "No se pudieron enviar tus datos",
    ),

  /* ============ Buzón de TIC (lectura automática por IMAP) ============ */

  correosBuzon: (resultado?: ResultadoCorreo) =>
    request(
      async () =>
        (await apiClient.get<CorreoBuzon[]>(`${BASE}/admin/buzon`, { params: resultado ? { resultado } : {} })).data,
      "Error al obtener los correos del buzón",
    ),

  estadoBuzon: () =>
    request(
      async () => (await apiClient.get<EstadoBuzon>(`${BASE}/admin/buzon/estado`)).data,
      "Error al obtener el estado del buzón",
    ),

  /**
   * Asocia un correo SIN_ASOCIAR a una solicitud lista para ticket (formulario enviado o tomada):
   * le asigna el ticket y aplica en orden los correos pendientes de ese ticket.
   * Errores: TICKET_DUPLICADO, TICKET_DISTINTO, ESTADO_SIN_TICKET, CORREO_NO_ASOCIABLE.
   */
  asociarCorreo: (idCorreo: number, idSolicitud: number) =>
    request(
      async () =>
        (
          await apiClient.post<{ idSolicitud: number; codigoTicket: string; correosAplicados: number }>(
            `${BASE}/admin/buzon/${idCorreo}/asociar`,
            { idSolicitud },
          )
        ).data,
      "Error al asociar el correo",
    ),

  /** Descarta un correo SIN_ASOCIAR o SIN_TICKET que no es de la mesa de ayuda. */
  descartarCorreo: (idCorreo: number) =>
    request(
      async () => (await apiClient.post<CorreoBuzon>(`${BASE}/admin/buzon/${idCorreo}/descartar`)).data,
      "Error al descartar el correo",
    ),

  /** BUZON_DESHABILITADO, BUZON_EN_REVISION o BUZON_ERROR si no se puede. */
  revisarBuzon: () =>
    request(
      async () => (await apiClient.post<{ procesados: number }>(`${BASE}/admin/buzon/revisar`)).data,
      "Error al revisar el buzón",
    ),
};
