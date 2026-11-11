import { apiClient } from "../client";
import { request } from "../errors";
import type {
  AprobarSolicitudRequest,
  CancelarMiReservaRequest,
  CancelarReservaRequest,
  EditarReservaAdminRequest,
  EstadoSolicitudCambio,
  IsoDate,
  ModificarMiReservaRequest,
  ReasignarReservaRequest,
  RechazarSolicitudReservaRequest,
  ReservaDirectaRequest,
  ResponderCambioRequest,
  SolicitarCambioRequest,
  SolicitudCambio,
  SolicitudExtraRequest,
  SolicitudReserva,
  UsoSala,
} from "@/types/api";

const BASE = "/reservas-salas";

/**
 * Endpoints de `/api/reservas-salas` (backend v4.1). El usuario que reserva o
 * atiende sale de la sesión; ya no se envían `idUsuario` ni `idAdmin`.
 */
export const reservaSalasService = {
  /* ============ Agenda ============ */

  /** GET /agenda?idSala=&fecha=. El Profesor solo la ve con el módulo disponible. */
  obtenerAgenda: (idSala: number, fecha?: IsoDate) =>
    request(
      async () =>
        (await apiClient.get<UsoSala[]>(`${BASE}/agenda`, { params: fecha ? { idSala, fecha } : { idSala } })).data,
      "Error al obtener la agenda",
    ),

  /** GET /admin/agenda?fecha=: todas las salas del día (Admin y Operador). */
  agendaGeneral: (fecha?: IsoDate) =>
    request(
      async () => (await apiClient.get<UsoSala[]>(`${BASE}/admin/agenda`, { params: fecha ? { fecha } : {} })).data,
      "Error al obtener la agenda del día",
    ),

  /* ============ Profesor ============ */

  registrarReservaDirecta: (payload: ReservaDirectaRequest) =>
    request(
      async () => (await apiClient.post<UsoSala>(`${BASE}/reservar`, payload)).data,
      "Error al registrar la reserva",
    ),

  registrarSolicitudExtra: (payload: SolicitudExtraRequest) =>
    request(
      async () => (await apiClient.post<SolicitudReserva>(`${BASE}/solicitud-extra`, payload)).data,
      "Error al registrar la solicitud",
    ),

  misSolicitudes: () =>
    request(
      async () => (await apiClient.get<SolicitudReserva[]>(`${BASE}/mis-solicitudes`)).data,
      "Error al obtener tus solicitudes",
    ),

  /** GET /mis-reservas: propias desde hace 7 días, con `solicitudCambio` y `editablePorProfesor`. */
  misReservas: () =>
    request(async () => (await apiClient.get<UsoSala[]>(`${BASE}/mis-reservas`)).data, "Error al obtener tus reservas"),

  /** PUT /mis-reservas/{idUso}/cancelar: hasta el día anterior (MISMO_DIA). */
  cancelarMiReserva: (idUso: number, payload: CancelarMiReservaRequest) =>
    request(
      async () => (await apiClient.put<UsoSala>(`${BASE}/mis-reservas/${idUso}/cancelar`, payload)).data,
      "Error al cancelar la reserva",
    ),

  /** PUT /mis-reservas/{idUso}/modificar: exige un cambio Aceptada (SIN_CAMBIO_ACEPTADO). */
  modificarMiReserva: (idUso: number, payload: ModificarMiReservaRequest) =>
    request(
      async () => (await apiClient.put<UsoSala>(`${BASE}/mis-reservas/${idUso}/modificar`, payload)).data,
      "Error al modificar la reserva",
    ),

  /** Solo Admin: edita directamente su reserva (también las de un profesor sin cuenta). */
  editarReservaAdmin: (idUso: number, payload: EditarReservaAdminRequest) =>
    request(
      async () => (await apiClient.put<UsoSala>(`${BASE}/mis-reservas/${idUso}/editar`, payload)).data,
      "Error al modificar la reserva",
    ),

  /** PUT /solicitudes-cambio/{id}/responder: el profesor acepta o rechaza (con respuesta). */
  responderCambio: (idSolicitudCambio: number, payload: ResponderCambioRequest) =>
    request(
      async () =>
        (await apiClient.put<SolicitudCambio>(`${BASE}/solicitudes-cambio/${idSolicitudCambio}/responder`, payload))
          .data,
      "Error al responder la solicitud de cambio",
    ),

  /* ============ Administración / Operador ============ */

  listarSolicitudesPendientes: () =>
    request(
      async () => (await apiClient.get<SolicitudReserva[]>(`${BASE}/admin/solicitudes-pendientes`)).data,
      "Error al obtener las solicitudes pendientes",
    ),

  aprobarSolicitud: (payload: AprobarSolicitudRequest) =>
    request(
      async () => (await apiClient.post<UsoSala>(`${BASE}/admin/aprobar-solicitud`, payload)).data,
      "Error al aprobar la solicitud",
    ),

  rechazarSolicitud: (payload: RechazarSolicitudReservaRequest) =>
    request(
      async () => (await apiClient.post<SolicitudReserva>(`${BASE}/admin/rechazar-solicitud`, payload)).data,
      "Error al rechazar la solicitud",
    ),

  reasignarReserva: (payload: ReasignarReservaRequest) =>
    request(
      async () => (await apiClient.put<UsoSala>(`${BASE}/admin/reasignar`, payload)).data,
      "Error al reasignar la reserva",
    ),

  cancelarReserva: (payload: CancelarReservaRequest) =>
    request(
      async () => (await apiClient.put<UsoSala>(`${BASE}/admin/cancelar`, payload)).data,
      "Error al cancelar la reserva",
    ),

  /** POST /admin/solicitar-cambio: una vigente por reserva (CAMBIO_VIGENTE), no el mismo día (MISMO_DIA). */
  solicitarCambio: (payload: SolicitarCambioRequest) =>
    request(
      async () => (await apiClient.post<SolicitudCambio>(`${BASE}/admin/solicitar-cambio`, payload)).data,
      "Error al enviar la solicitud de cambio",
    ),

  /** GET /admin/solicitudes-cambio?estado=: sin filtro, las 200 más recientes. */
  solicitudesCambio: (estado?: EstadoSolicitudCambio) =>
    request(
      async () =>
        (await apiClient.get<SolicitudCambio[]>(`${BASE}/admin/solicitudes-cambio`, { params: estado ? { estado } : {} }))
          .data,
      "Error al obtener las solicitudes de cambio",
    ),
};
