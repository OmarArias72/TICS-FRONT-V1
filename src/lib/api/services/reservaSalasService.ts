import { apiClient } from "../client";
import { request } from "../errors";
import type {
  AprobarSolicitudRequest,
  CancelarReservaRequest,
  IsoDate,
  ReasignarReservaRequest,
  RechazarSolicitudReservaRequest,
  ReservaDirectaRequest,
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
};
