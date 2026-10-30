import { apiClient } from "../client";
import { request } from "../errors";
import type {
  CapturarTicketRequest,
  CrearSolicitudRequest,
  FiltroPanelAdmin,
  LlenarFormularioRequest,
  RechazarSolicitudTecnicaRequest,
  ResolverTicketRequest,
  SolicitudTecnica,
  TipoSolicitud,
} from "@/types/api";

const BASE = "/solicitudes-tecnicas";

/**
 * Endpoints de la mesa de ayuda.
 *
 * El backend identifica a quien actúa mediante los parámetros `idUsuario`
 * (alumno) e `idAdmin` (TICS) en la URL; se conservan tal cual.
 */
export const solicitudTecnicaService = {
  /* ============ Catálogos ============ */

  obtenerTipos: () =>
    request(
      async () => (await apiClient.get<TipoSolicitud[]>(`${BASE}/catalogos/tipos`)).data,
      "Error al obtener los tipos de solicitud",
    ),

  /* ============ Alumno ============ */

  misSolicitudes: (idUsuario: number) =>
    request(
      async () =>
        (
          await apiClient.get<SolicitudTecnica[]>(`${BASE}/mis-solicitudes`, {
            params: { idUsuario },
          })
        ).data,
      "Error al obtener tus solicitudes",
    ),

  /** Límites del backend: 3 solicitudes activas y 24 h entre solicitudes del mismo tipo. */
  crearSolicitud: (idUsuario: number, payload: CrearSolicitudRequest) =>
    request(
      async () =>
        (
          await apiClient.post<SolicitudTecnica>(`${BASE}/crear`, payload, {
            params: { idUsuario },
          })
        ).data,
      "Error al crear la solicitud",
    ),

  /**
   * Solo para solicitudes RECHAZADAS: vuelven a PENDIENTE con el nuevo motivo.
   * El backend ignora `idTipo` al reabrir (conserva el tipo original), así que
   * solo se envía el motivo. El original mandaba `tipoId || 1`.
   */
  reenviarSolicitud: (idSolicitud: number, idUsuario: number, payload: { motivo: string }) =>
    request(
      async () =>
        (
          await apiClient.put<SolicitudTecnica>(`${BASE}/${idSolicitud}/reenviar`, payload, {
            params: { idUsuario },
          })
        ).data,
      "Error al reenviar",
    ),

  llenarFormulario: (idSolicitud: number, idUsuario: number, payload: LlenarFormularioRequest) =>
    request(
      async () =>
        (
          await apiClient.put<SolicitudTecnica>(`${BASE}/${idSolicitud}/formulario`, payload, {
            params: { idUsuario },
          })
        ).data,
      "Error al guardar el formulario",
    ),

  cancelarSolicitud: (idSolicitud: number, idUsuario: number) =>
    request(
      async () =>
        (
          await apiClient.put<SolicitudTecnica>(`${BASE}/${idSolicitud}/cancelar`, null, {
            params: { idUsuario },
          })
        ).data,
      "Error al cancelar",
    ),

  /**
   * PUT /{id}/cerrar. Faltaba en el servicio original aunque
   * DetalleSolicitudAlumnoModal ya lo llamaba.
   *
   * El backend solo lo acepta desde el estado RESUELTO, pero `resolverTicket`
   * pasa directamente a CERRADA; con el flujo actual esta llamada responde
   * 400 "No puedes cerrar esta solicitud". Por eso ninguna pantalla la usa
   * (decisión 12 en docs/MIGRACION.md); se conserva para la refactorización.
   */
  cerrarSolicitud: (idSolicitud: number, idUsuario: number) =>
    request(
      async () =>
        (
          await apiClient.put<SolicitudTecnica>(`${BASE}/${idSolicitud}/cerrar`, null, {
            params: { idUsuario },
          })
        ).data,
      "Error al cerrar la solicitud",
    ),

  /* ============ Administración / Operador ============ */

  panelAdmin: (filtro: FiltroPanelAdmin) =>
    request(
      async () =>
        (await apiClient.get<SolicitudTecnica[]>(`${BASE}/admin/panel`, { params: { filtro } }))
          .data,
      "Error al obtener el panel de solicitudes",
    ),

  aprobarSolicitud: (idSolicitud: number, idAdmin: number) =>
    request(
      async () =>
        (
          await apiClient.post<SolicitudTecnica>(`${BASE}/admin/${idSolicitud}/aprobar`, null, {
            params: { idAdmin },
          })
        ).data,
      "Error al aprobar la solicitud",
    ),

  rechazarSolicitud: (
    idSolicitud: number,
    idAdmin: number,
    payload: RechazarSolicitudTecnicaRequest,
  ) =>
    request(
      async () =>
        (
          await apiClient.post<SolicitudTecnica>(
            `${BASE}/admin/${idSolicitud}/rechazar`,
            payload,
            { params: { idAdmin } },
          )
        ).data,
      "Error al rechazar la solicitud",
    ),

  /** Toma la solicitud para generar el ticket (bloqueo de 10 minutos en el backend). */
  bloquearSolicitud: (idSolicitud: number, idAdmin: number) =>
    request(
      async () =>
        (
          await apiClient.post<SolicitudTecnica>(`${BASE}/admin/${idSolicitud}/bloquear`, null, {
            params: { idAdmin },
          })
        ).data,
      "No se pudo tomar la solicitud",
    ),

  capturarTicket: (idSolicitud: number, idAdmin: number, payload: CapturarTicketRequest) =>
    request(
      async () =>
        (
          await apiClient.post<SolicitudTecnica>(
            `${BASE}/admin/${idSolicitud}/capturar-ticket`,
            payload,
            { params: { idAdmin } },
          )
        ).data,
      "Error al capturar el ticket",
    ),

  resolverTicket: (idSolicitud: number, idAdmin: number, payload: ResolverTicketRequest) =>
    request(
      async () =>
        (
          await apiClient.post<SolicitudTecnica>(
            `${BASE}/admin/${idSolicitud}/resolver-ticket`,
            payload,
            { params: { idAdmin } },
          )
        ).data,
      "Error al resolver el ticket",
    ),
};
