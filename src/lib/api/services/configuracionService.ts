import { apiClient } from "../client";
import { request } from "../errors";
import type { ConfiguracionModulo, ConfiguracionModuloRequest } from "@/types/api";

/** Claves de módulo configurables. Hoy solo existe el de reservas. */
export type ClaveModulo = "RESERVAS";

/** Endpoints de `/api/configuracion/modulos`. Leer: cualquier sesión; cambiar: Admin. */
export const configuracionService = {
  obtenerModulo: (clave: ClaveModulo) =>
    request(
      async () => (await apiClient.get<ConfiguracionModulo>(`/configuracion/modulos/${clave}`)).data,
      "Error al obtener la configuración del módulo",
    ),

  actualizarModulo: (clave: ClaveModulo, payload: ConfiguracionModuloRequest) =>
    request(
      async () => (await apiClient.put<ConfiguracionModulo>(`/configuracion/modulos/${clave}`, payload)).data,
      "Error al guardar la configuración del módulo",
    ),
};
