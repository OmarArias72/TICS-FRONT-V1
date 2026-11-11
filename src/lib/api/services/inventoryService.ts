import { isAxiosError } from "axios";

import { apiClient } from "../client";
import { request } from "../errors";
import type {
  AgrupacionConteo,
  ConteoInventario,
  EquipoCreateRequest,
  EquipoMovilCreate,
  EquipoVista,
  EstadoEquipo,
  FiltrosReporte,
} from "@/types/api";

/** Búsqueda por texto: todos los endpoints `buscar-*` comparten forma. */
const buscar = (ruta: string, query: string) =>
  request(
    async () => (await apiClient.post<EquipoVista[]>(`/inventory/${ruta}`, { query })).data,
    "Error al buscar equipos",
  );

export type FormatoReporte = "pdf" | "xlsx" | "csv";

/**
 * Descarga de reportes. Solo envía los filtros que tienen valor.
 * Con `responseType: "blob"` el error del backend también llega como Blob;
 * se convierte a JSON para poder leer su `message` y `codigo`.
 */
const descargarReporte = (formato: FormatoReporte, filtros: FiltrosReporte) =>
  request(async () => {
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, valor]) => Boolean(valor)),
    );
    try {
      const { data } = await apiClient.get<Blob>(`/reportes/equipos/${formato}`, {
        params,
        responseType: "blob",
      });
      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.data instanceof Blob) {
        try {
          error.response.data = JSON.parse(await error.response.data.text());
        } catch {
          // No era JSON: se queda el mensaje por defecto.
        }
      }
      throw error;
    }
  }, `Error al descargar el reporte ${formato.toUpperCase()}`);

const conteo = (agruparPor: AgrupacionConteo) =>
  request(
    async () =>
      (await apiClient.get<ConteoInventario[]>("/inventory/conteo", { params: { agruparPor } }))
        .data,
    "Error al obtener el conteo del inventario",
  );

/** Endpoints de `/api/inventory` y `/api/reportes/equipos`. */
export const inventoryService = {
  listarEquipos: () =>
    request(
      async () => (await apiClient.get<EquipoVista[]>("/inventory/equipos")).data,
      "Error al obtener el inventario",
    ),

  crearEquipoMovil: (equipoData: EquipoMovilCreate) =>
    request(
      async () =>
        (await apiClient.post<EquipoVista>("/inventory/crear-equipo-movil", equipoData)).data,
      "Parámetros inválidos",
      { 500: "Error en el servidor al intentar crear el equipo" },
    ),

  buscarPorSerie: (query: string) => buscar("buscar-por-serie", query),
  buscarPorMarca: (query: string) => buscar("buscar-por-marca", query),
  buscarPorModelo: (query: string) => buscar("buscar-por-modelo", query),
  buscarPorArticulo: (query: string) => buscar("buscar-por-articulo", query),
  buscarGlobal: (query: string) => buscar("buscar-global", query),

  /** PATCH /inventory/estado-masivo. Admin y Operador pasan a BAJA; sacar de BAJA solo el Admin (SOLO_ADMIN_BAJA). */
  actualizarEstadoMasivo: (inventarios: string[], nuevoEstado: EstadoEquipo, observacion?: string) =>
    request(
      async () =>
        (
          await apiClient.patch<EquipoVista[]>("/inventory/estado-masivo", {
            inventarios,
            nuevoEstado,
            observacion: observacion || null,
          })
        ).data,
      "Error al actualizar el estado masivo",
    ),

  /** Alta completa desde la web (artículo, marca y modelo se crean si no existen). */
  crearEquipoCompleto: (equipoData: EquipoCreateRequest) =>
    request(
      async () => (await apiClient.post<EquipoVista>("/inventory/crear", equipoData)).data,
      "Error al crear el equipo completo",
    ),

  actualizarEquipo: (inventario: string, equipoData: EquipoCreateRequest) =>
    request(
      async () =>
        (
          await apiClient.put<EquipoVista>(
            `/inventory/${encodeURIComponent(inventario)}`,
            equipoData,
          )
        ).data,
      "Error al actualizar el equipo",
      { 404: "El equipo a actualizar no existe" },
    ),

  /** DELETE /inventory/{inventario}. Responde 204 sin cuerpo. */
  eliminarEquipo: (inventario: string) =>
    request(
      async () => {
        await apiClient.delete(`/inventory/${encodeURIComponent(inventario)}`);
        return true as const;
      },
      "Error al eliminar el equipo",
      { 404: "El equipo a eliminar no existe" },
    ),

  /** GET /reportes/equipos/{pdf|xlsx|csv}. Cada descarga queda en la auditoría. */
  descargarReporte: (formato: FormatoReporte, filtros: FiltrosReporte) => descargarReporte(formato, filtros),

  contarPorArticulo: () => conteo("articulo"),
  contarPorModelo: () => conteo("modelo"),
};
