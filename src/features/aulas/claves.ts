/** Claves de caché del Mapa de Aulas. */
export const clavesAulas = {
  /** Misma clave que usa Reservas, para compartir la lista de salas. */
  salas: ["salas"] as const,
  equipos: ["equipos-computo"] as const,
};

/** Claves del módulo de Inventario que cambian al guardar o borrar una PC. */
export const CLAVES_INVENTARIO = [["equipos"], ["conteo-inventario"]] as const;
