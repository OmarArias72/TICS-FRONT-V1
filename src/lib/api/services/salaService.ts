import { apiClient } from "../client";
import { request } from "../errors";
import type { Sala, SalaRequest } from "@/types/api";

/** Endpoints de `/api/salas`. */
export const salaService = {
  listarTodas: () =>
    request(async () => (await apiClient.get<Sala[]>("/salas")).data, "Error al obtener las salas"),

  obtenerPorId: (id: number) =>
    request(
      async () => (await apiClient.get<Sala>(`/salas/${id}`)).data,
      "Error al obtener la sala",
      { 404: "Sala no encontrada" },
    ),

  /** GET /salas/buscar?query=... */
  buscar: (query: string) =>
    request(
      async () => (await apiClient.get<Sala[]>("/salas/buscar", { params: { query } })).data,
      "Error al buscar salas",
    ),

  crear: (salaData: SalaRequest) =>
    request(
      async () => (await apiClient.post<Sala>("/salas", salaData)).data,
      "Parámetros inválidos para crear la sala",
    ),

  actualizar: (id: number, salaData: SalaRequest) =>
    request(
      async () => (await apiClient.put<Sala>(`/salas/${id}`, salaData)).data,
      "Parámetros inválidos",
      { 404: "Sala no encontrada para actualizar" },
    ),

  eliminar: (id: number) =>
    request(
      async () => {
        await apiClient.delete(`/salas/${id}`);
        return true as const;
      },
      "Error al eliminar la sala",
      { 404: "Sala no encontrada para eliminar" },
    ),
};
