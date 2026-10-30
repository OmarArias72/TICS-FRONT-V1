import type { IsoDateTime } from "./common";

/**
 * Contratos de salas (SalaController, `/api/salas`).
 */

/**
 * Entidad `Sala`. El controlador la serializa directamente (no usa DTO),
 * por eso incluye las fechas de auditoría.
 */
export interface Sala {
  idSala: number;
  codigoSala: string;
  nombre: string | null;
  ubicacion: string | null;
  descripcion: string | null;
  fechaCreacion: IsoDateTime | null;
  fechaActualizacion: IsoDateTime | null;
}

/** SalaDTO: cuerpo para crear o actualizar una sala. */
export interface SalaRequest {
  codigoSala: string;
  nombre?: string | null;
  ubicacion?: string | null;
  descripcion?: string | null;
}
