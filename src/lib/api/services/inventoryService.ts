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

/** Descarga de reportes. Solo envía los filtros que tienen valor. */
const descargarReporte = (formato: "pdf" | "csv", filtros: FiltrosReporte) =>
  request(async () => {
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, valor]) => Boolean(valor)),
    );
    const { data } = await apiClient.get<Blob>(`/reportes/equipos/${formato}`, {
      params,
      responseType: "blob",
    });
    return data;
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

  actualizarEstadoMasivo: (inventarios: string[], nuevoEstado: EstadoEquipo) =>
    request(
      async () =>
        (
          await apiClient.patch<EquipoVista[]>("/inventory/estado-masivo", {
            inventarios,
            nuevoEstado,
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

  descargarReportePdf: (fechaInicio?: string, fechaFin?: string, articulo?: string) =>
    descargarReporte("pdf", { fechaInicio, fechaFin, articulo }),

  descargarReporteCsv: (fechaInicio?: string, fechaFin?: string, articulo?: string) =>
    descargarReporte("csv", { fechaInicio, fechaFin, articulo }),

  contarPorArticulo: () => conteo("articulo"),
  contarPorModelo: () => conteo("modelo"),
};
