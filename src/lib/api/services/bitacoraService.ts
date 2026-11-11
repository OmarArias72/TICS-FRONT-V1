import { isAxiosError } from "axios";

import { apiClient } from "../client";
import { request } from "../errors";
import type {
  CatalogosAuditoria,
  CatalogosBitacora,
  FiltrosAuditoria,
  FiltrosBitacora,
  Pagina,
  RegistroAuditoria,
  RegistroBitacora,
} from "@/types/api";

/** Quita los filtros vacíos para no enviar `?texto=`. */
const limpiar = (filtros: object) =>
  Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ""));

/** Descarga un CSV; si el backend responde un error, se lee su JSON (llega como Blob). */
const descargarCsv = (ruta: string, filtros: object) =>
  request(async () => {
    try {
      const { data } = await apiClient.get<Blob>(ruta, { params: limpiar(filtros), responseType: "blob" });
      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.data instanceof Blob) {
        try {
          error.response.data = JSON.parse(await error.response.data.text());
        } catch {
          // No era JSON: queda el mensaje por defecto.
        }
      }
      throw error;
    }
  }, "Error al exportar");

/**
 * Módulo de logs:
 * - `/api/bitacora`: cambios en equipos (Admin y Operador-tics).
 * - `/api/auditoria`: acciones de todo el sistema (solo Admin).
 */
export const bitacoraService = {
  buscar: (filtros: FiltrosBitacora, pagina = 0, tamano = 50) =>
    request(
      async () =>
        (await apiClient.get<Pagina<RegistroBitacora>>("/bitacora", { params: { ...limpiar(filtros), pagina, tamano } }))
          .data,
      "Error al consultar la bitácora",
    ),

  catalogos: () =>
    request(
      async () => (await apiClient.get<CatalogosBitacora>("/bitacora/catalogos")).data,
      "Error al obtener los filtros de la bitácora",
    ),

  /** Hasta 10 000 filas con los mismos filtros; la exportación queda en la auditoría. */
  exportarCsv: (filtros: FiltrosBitacora) => descargarCsv("/bitacora/csv", filtros),

  /** Historial de un equipo (`GET /inventory/{inventario}/bitacora`), más reciente primero. */
  historialEquipo: (inventario: string, limite = 200) =>
    request(
      async () =>
        (
          await apiClient.get<RegistroBitacora[]>(`/inventory/${encodeURIComponent(inventario)}/bitacora`, {
            params: { limite },
          })
        ).data,
      "Error al obtener el historial del equipo",
    ),
};

export const auditoriaService = {
  buscar: (filtros: FiltrosAuditoria, pagina = 0, tamano = 50) =>
    request(
      async () =>
        (await apiClient.get<Pagina<RegistroAuditoria>>("/auditoria", { params: { ...limpiar(filtros), pagina, tamano } }))
          .data,
      "Error al consultar la auditoría",
    ),

  catalogos: () =>
    request(
      async () => (await apiClient.get<CatalogosAuditoria>("/auditoria/catalogos")).data,
      "Error al obtener los filtros de la auditoría",
    ),

  exportarCsv: (filtros: FiltrosAuditoria) => descargarCsv("/auditoria/csv", filtros),
};
