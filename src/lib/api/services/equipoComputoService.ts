import { apiClient } from "../client";
import { request } from "../errors";
import type { EquipoComputo, EquipoComputoRequest } from "@/types/api";

/**
 * Endpoints de `/api/equipos-computo` (equipo base + detalle técnico).
 *
 * Se omitió el alias `guardarODetalleTecnico` del original: ningún componente
 * lo usaba y sus funciones las cubren `crear` y `actualizar`.
 */
export const equipoComputoService = {
  listarTodos: () =>
    request(
      async () => (await apiClient.get<EquipoComputo[]>("/equipos-computo")).data,
      "Error al obtener los equipos de cómputo",
    ),

  obtenerPorId: (id: number) =>
    request(
      async () => (await apiClient.get<EquipoComputo>(`/equipos-computo/${id}`)).data,
      "Error al obtener el equipo de cómputo",
      { 404: "Equipo de cómputo no encontrado" },
    ),

  obtenerPorInventario: (inventario: string) =>
    request(
      async () =>
        (
          await apiClient.get<EquipoComputo>(
            `/equipos-computo/inventario/${encodeURIComponent(inventario)}`,
          )
        ).data,
      "Error al obtener el equipo de cómputo",
      { 404: "Número de inventario no encontrado" },
    ),

  listarPorSala: (idSala: number) =>
    request(
      async () => (await apiClient.get<EquipoComputo[]>(`/equipos-computo/sala/${idSala}`)).data,
      "Error al obtener los equipos de la sala",
    ),

  /**
   * POST /equipos-computo. Un 500 se muestra con un mensaje genérico para no
   * exponer el detalle interno que concatena el backend.
   */
  crear: (requestData: EquipoComputoRequest) =>
    request(
      async () => (await apiClient.post<EquipoComputo>("/equipos-computo", requestData)).data,
      "Datos del equipo inválidos",
      { 500: "Error interno del servidor al crear el equipo" },
    ),

  actualizar: (id: number, requestData: EquipoComputoRequest) =>
    request(
      async () =>
        (await apiClient.put<EquipoComputo>(`/equipos-computo/${id}`, requestData)).data,
      "Datos inválidos para actualizar",
      { 404: "Equipo de cómputo no encontrado" },
    ),

  eliminar: (id: number) =>
    request(
      async () => {
        await apiClient.delete(`/equipos-computo/${id}`);
        return true as const;
      },
      "Error al eliminar el equipo",
      { 404: "No se encontró el equipo para eliminar" },
    ),
};
