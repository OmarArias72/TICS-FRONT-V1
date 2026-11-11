import { apiClient } from "../client";
import { request } from "../errors";
import type { BandejaNotificaciones } from "@/types/api";

const BASE = "/notificaciones";

/** Endpoints de `/api/notificaciones` (cualquier usuario con sesión, backend v4.1). */
export const notificacionService = {
  /** GET /notificaciones?limite=&soloNoLeidas=. `limite` entre 1 y 100. */
  listar: (limite = 30, soloNoLeidas = false) =>
    request(
      async () => (await apiClient.get<BandejaNotificaciones>(BASE, { params: { limite, soloNoLeidas } })).data,
      "Error al obtener las notificaciones",
    ),

  /** GET /notificaciones/conteo: para el globo de la campana. */
  conteo: () =>
    request(
      async () => (await apiClient.get<{ noLeidas: number }>(`${BASE}/conteo`)).data,
      "Error al obtener las notificaciones",
    ),

  marcarLeida: (idNotificacion: number) =>
    request(async () => {
      await apiClient.put(`${BASE}/${idNotificacion}/leida`);
    }, "Error al marcar la notificación"),

  marcarTodasLeidas: () =>
    request(async () => {
      await apiClient.put(`${BASE}/leidas`);
    }, "Error al marcar las notificaciones"),

  /** DELETE /notificaciones/{id}: 404 si no es del usuario. */
  eliminar: (idNotificacion: number) =>
    request(async () => {
      await apiClient.delete(`${BASE}/${idNotificacion}`);
    }, "Error al quitar la notificación"),
};
