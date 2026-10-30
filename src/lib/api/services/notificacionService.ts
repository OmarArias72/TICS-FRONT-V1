import { apiClient } from "../client";
import { request } from "../errors";
import type { Notificacion } from "@/types/api";

const BASE = "/notificaciones";

/**
 * Endpoints de `/api/notificaciones`. Pendientes en el backend: protegidos por
 * FUNCIONES_BACKEND.notificaciones.
 */
export const notificacionService = {
  listar: (idUsuario: number) =>
    request(
      async () => (await apiClient.get<Notificacion[]>(BASE, { params: { idUsuario } })).data,
      "Error al obtener las notificaciones",
    ),

  marcarLeida: (idNotificacion: number, idUsuario: number) =>
    request(
      async () => {
        await apiClient.put(`${BASE}/${idNotificacion}/leida`, null, { params: { idUsuario } });
      },
      "Error al marcar la notificación",
    ),

  marcarTodasLeidas: (idUsuario: number) =>
    request(
      async () => {
        await apiClient.put(`${BASE}/leidas`, null, { params: { idUsuario } });
      },
      "Error al marcar las notificaciones",
    ),
};
