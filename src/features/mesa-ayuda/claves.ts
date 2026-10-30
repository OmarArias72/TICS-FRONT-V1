/** Claves de caché de React Query de la mesa de ayuda. */
export const clavesMesaAyuda = {
  tipos: ["tipos-solicitud-tecnica"] as const,
  misSolicitudes: (idUsuario?: number) => ["mis-solicitudes-tecnicas", idUsuario] as const,
  panel: ["panel-mesa-ayuda"] as const,
};

/**
 * Página general de ServiceDesk de TICS (decisión 2026-10-30). El original
 * abría una orden de trabajo fija (woID=46873), la misma para todas las
 * solicitudes.
 */
export const URL_SERVICEDESK = "https://msdtic.uaemex.mx/";
