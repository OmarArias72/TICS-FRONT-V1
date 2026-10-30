import { apiClient } from "../client";
import { request } from "../errors";
import type {
  AprobarSolicitudRequest,
  CancelarMiReservaRequest,
  CancelarReservaRequest,
  IsoDate,
  MiReserva,
  ModificarMiReservaRequest,
  ReasignarReservaRequest,
  RechazarSolicitudReservaRequest,
  ReservaDirectaRequest,
  ResponderCambioRequest,
  SolicitarCambioRequest,
  SolicitudCambioReserva,
  SolicitudExtraRequest,
  SolicitudReserva,
  UsoSala,
} from "@/types/api";

const BASE = "/reservas-salas";

/** Endpoints de `/api/reservas-salas`. */
export const reservaSalasService = {
  /* ============ Agenda pública ============ */

  /** GET /agenda?idSala=&fecha=. Sin fecha, el backend usa su criterio por defecto. */
  obtenerAgenda: (idSala: number, fecha?: IsoDate) =>
    request(
      async () =>
        (
          await apiClient.get<UsoSala[]>(`${BASE}/agenda`, {
            params: fecha ? { idSala, fecha } : { idSala },
          })
        ).data,
      "Error al obtener la agenda",
    ),

  /* ============ Profesor / usuario ============ */

  registrarReservaDirecta: (payload: ReservaDirectaRequest) =>
    request(
      async () => (await apiClient.post<UsoSala>(`${BASE}/reservar`, payload)).data,
      "Error al registrar la reserva",
    ),

  registrarSolicitudExtra: (payload: SolicitudExtraRequest) =>
    request(
      async () =>
        (await apiClient.post<SolicitudReserva>(`${BASE}/solicitud-extra`, payload)).data,
      "Error al registrar la solicitud",
    ),

  misSolicitudes: (idUsuario: number) =>
    request(
      async () =>
        (
          await apiClient.get<SolicitudReserva[]>(`${BASE}/mis-solicitudes`, {
            params: { idUsuario },
          })
        ).data,
      "Error al obtener tus solicitudes",
    ),

  /* ============ Administración ============ */

  listarSolicitudesPendientes: () =>
    request(
      async () =>
        (await apiClient.get<SolicitudReserva[]>(`${BASE}/admin/solicitudes-pendientes`)).data,
      "Error al obtener las solicitudes pendientes",
    ),

  aprobarSolicitud: (payload: AprobarSolicitudRequest) =>
    request(
      async () =>
        (await apiClient.post<UsoSala>(`${BASE}/admin/aprobar-solicitud`, payload)).data,
      "Error al aprobar la solicitud",
    ),

  rechazarSolicitud: (payload: RechazarSolicitudReservaRequest) =>
    request(
      async () =>
        (await apiClient.post<SolicitudReserva>(`${BASE}/admin/rechazar-solicitud`, payload))
          .data,
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

  /* ============ Pendiente de backend (FUNCIONES_BACKEND) ============ */

  /** GET /mis-reservas?idUsuario=: reservas del profesor desde hoy. */
  misReservas: (idUsuario: number) =>
    request(
      async () =>
        (await apiClient.get<MiReserva[]>(`${BASE}/mis-reservas`, { params: { idUsuario } })).data,
      "Error al obtener tus reservas",
    ),

  /** PUT /mis-reservas/{idUso}/cancelar: permitido hasta el día anterior. */
  cancelarMiReserva: (idUso: number, payload: CancelarMiReservaRequest) =>
    request(
      async () => (await apiClient.put<UsoSala>(`${BASE}/mis-reservas/${idUso}/cancelar`, payload)).data,
      "Error al cancelar la reserva",
    ),

  /** PUT /mis-reservas/{idUso}/modificar: requiere una solicitud de cambio aceptada. */
  modificarMiReserva: (idUso: number, payload: ModificarMiReservaRequest) =>
    request(
      async () => (await apiClient.put<UsoSala>(`${BASE}/mis-reservas/${idUso}/modificar`, payload)).data,
      "Error al modificar la reserva",
    ),

  /** POST /admin/solicitar-cambio: el admin pide al profesor cambiar su reserva. */
  solicitarCambio: (payload: SolicitarCambioRequest) =>
    request(
      async () =>
        (await apiClient.post<SolicitudCambioReserva>(`${BASE}/admin/solicitar-cambio`, payload)).data,
      "Error al enviar la solicitud de cambio",
    ),

  /** PUT /solicitudes-cambio/{id}/responder: el profesor acepta o rechaza. */
  responderCambio: (idSolicitudCambio: number, payload: ResponderCambioRequest) =>
    request(
      async () =>
        (
          await apiClient.put<SolicitudCambioReserva>(
            `${BASE}/solicitudes-cambio/${idSolicitudCambio}/responder`,
            payload,
          )
        ).data,
      "Error al responder la solicitud de cambio",
    ),
};
