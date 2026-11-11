import type { IsoDate, IsoDateTime, ValorConocido } from "./common";

/** Página de resultados del backend (`PaginaDTO`). */
export interface Pagina<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
}

/** Módulo que hizo el cambio en un equipo (columna `origen`). */
export type OrigenBitacora = ValorConocido<"INVENTARIO" | "EQUIPO_COMPUTO" | "MANTENIMIENTO" | "APP_MOVIL">;

/**
 * Acciones de la bitácora de equipos. ACTUALIZAR genera una fila por campo con
 * su valor anterior y el nuevo; las contraseñas aparecen como "(oculto)".
 */
export type AccionBitacora = ValorConocido<
  | "ALTA"
  | "ALTA_MOVIL"
  | "ALTA_DETALLE_COMPUTO"
  | "ACTUALIZAR"
  | "CAMBIO_ESTADO"
  | "CAMBIO_ESTADO_MASIVO"
  | "CAMBIO_CONTRASENA"
  | "VER_CONTRASENA"
  | "MANTENIMIENTO_REGISTRADO"
  | "MANTENIMIENTO_FINALIZADO"
  | "MANTENIMIENTO_CANCELADO"
  | "ELIMINAR"
>;

/** BitacoraDTO: un cambio en un equipo. */
export interface RegistroBitacora {
  idBitacora: number;
  inventario: string;
  origen: OrigenBitacora;
  /** null = proceso del sistema. */
  idUsuario: number | null;
  /** Nombre completo, o "Sistema". */
  usuario: string;
  correoUsuario: string | null;
  accion: AccionBitacora;
  /** "TODOS" en altas y bajas (el valor es un resumen del equipo). */
  campoModificado: string | null;
  valorAnterior: string | null;
  valorNuevo: string | null;
  observacion: string | null;
  ip: string | null;
  fechaHora: IsoDateTime;
}

/** Filtros de `GET /api/bitacora` (todos opcionales). */
export interface FiltrosBitacora {
  inventario?: string;
  origen?: OrigenBitacora;
  accion?: string;
  idUsuario?: number;
  /** Busca en campo, valores y observación, sin distinguir acentos. */
  texto?: string;
  desde?: IsoDate;
  hasta?: IsoDate;
}

/** `GET /api/bitacora/catalogos`. */
export interface CatalogosBitacora {
  origenes: OrigenBitacora[];
  acciones: AccionBitacora[];
  usuarios: Array<{ idUsuario: number; nombre: string; correo: string }>;
}

/** AuditoriaDTO: acción registrada en todo el sistema (solo Admin). */
export interface RegistroAuditoria {
  idAuditoria: number;
  idUsuario: number | null;
  correoUsuario: string | null;
  accion: string;
  entidad: string;
  idEntidad: string | null;
  descripcion: string | null;
  ip: string | null;
  fecha: IsoDateTime;
}

/** Filtros de `GET /api/auditoria`. */
export interface FiltrosAuditoria {
  entidad?: string;
  idEntidad?: string;
  accion?: string;
  idUsuario?: number;
  /** Busca en descripción, correo, entidad e id, sin distinguir acentos. */
  texto?: string;
  desde?: IsoDate;
  hasta?: IsoDate;
}

/** `GET /api/auditoria/catalogos`. */
export interface CatalogosAuditoria {
  acciones: string[];
  entidades: string[];
}
