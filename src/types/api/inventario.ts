import type { IsoDateTime, ValorConocido } from "./common";

/**
 * Contratos del módulo `inventario`:
 * InventoryController (`/api/inventory`), EquipoComputoController
 * (`/api/equipos-computo`) y ReporteController (`/api/reportes/equipos`).
 */

/** Estado administrativo de un equipo (columna `equipos.estado`). */
export type EstadoEquipo = ValorConocido<"ALTA" | "BAJA" | "MANTENIMIENTO">;

/* ==================== Inventario general ==================== */

/** EquipoVistaDTO: fila del inventario general. */
export interface EquipoVista {
  inventario: string;
  serie: string | null;
  nombreArticulo: string;
  marca: string;
  modelo: string;
  cantidad: number | null;
  caracteristicas: string | null;
  fechaRegistro: IsoDateTime | null;
  fechaActualizacion: IsoDateTime | null;
  estado: EstadoEquipo;
  /** Quién registró el equipo (null en equipos anteriores al registro de autor). */
  registradoPorId: number | null;
  registradoPor: string | null;
  /** Última persona que lo modificó. */
  actualizadoPor: string | null;
}

/**
 * EquipoCreateRequest: alta completa (web) y edición por número de inventario.
 * Marca y modelo vacíos: al crear el backend usa "GENÉRICA" / "GENÉRICO";
 * al editar conserva los actuales.
 */
export interface EquipoCreateRequest {
  inventario: string;
  nombreArticulo: string;
  nombreMarca?: string | null;
  nombreModelo?: string | null;
  serie?: string | null;
  cantidad?: number | null;
  caracteristicas?: string | null;
  estado?: EstadoEquipo | null;
  /** Nota que queda en la bitácora del equipo. */
  observacion?: string | null;
}

/** EquipoMovilCreate: alta desde la app móvil. El usuario sale de la sesión. */
export type EquipoMovilCreate = EquipoCreateRequest;

/** BusquedaRequest: cuerpo de los endpoints `buscar-*`. */
export interface BusquedaRequest {
  query: string;
}

/** ActualizarEstadoMasivoRequest. */
export interface ActualizarEstadoMasivoRequest {
  inventarios: string[];
  nuevoEstado: EstadoEquipo;
  observacion?: string | null;
}

/** Criterio de agrupación de `GET /inventory/conteo`. */
export type AgrupacionConteo = "articulo" | "modelo";

/** ConteoInventarioDTO. */
export interface ConteoInventario {
  /** Nombre del artículo o "Marca - Modelo", según la agrupación. */
  categoria: string;
  total: number;
  alta: number;
  baja: number;
  mantenimiento: number;
}

/** Filtros opcionales de los reportes PDF, XLSX y CSV. */
export interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  articulo?: string;
}

/* ==================== Equipos de cómputo ==================== */

export type EstadoCpu = ValorConocido<
  "Funciona" | "No funciona" | "Con fallas" | "En revisión" | "Requiere mantenimiento"
>;

export type EstadoComputadora = ValorConocido<
  "Funcionando" | "No funciona" | "Requiere revisión" | "Requiere Mantenimiento"
>;

/** Valores válidos según `GET /api/catalogos/equipos` (los CHECK de la BD). */
export type EstadoTeclado = ValorConocido<
  | "Bueno"
  | "Teclas dañadas"
  | "Teclas faltantes"
  | "Algunas teclas no responden"
  | "Sin respuesta"
  | "Cable dañado"
  | "Dañado"
>;
export type EstadoMouse = ValorConocido<
  "Bueno" | "Clic dañado" | "Scroll dañado" | "Sin respuesta" | "Cable dañado" | "Dañado"
>;
export type EstadoCableEthernet = ValorConocido<
  "Bueno" | "Conector dañado" | "Cable cortado" | "Sin conexión" | "Dañado"
>;
export type EstadoMonitor = ValorConocido<
  | "Bueno"
  | "Sin imagen"
  | "Imagen distorsionada"
  | "Píxeles muertos"
  | "Pantalla rayada"
  | "Pantalla rota"
  | "Dañado"
>;

/** Campos técnicos comunes a la respuesta y al request. */
interface DetalleTecnico {
  especificacionesHardware: string | null;
  sistemaOperativo: string | null;
  softwareInstalado: string | null;
  estadoTeclado: EstadoTeclado | null;
  estadoMouse: EstadoMouse | null;
  estadoCableEthernet: EstadoCableEthernet | null;
  estadoMonitor: EstadoMonitor | null;
  procesador: string | null;
  ram: string | null;
  almacenamiento: string | null;
  estadoCpu: EstadoCpu | null;
  estadoComputadora: EstadoComputadora | null;
  observaciones: string | null;
}

/**
 * EquipoComputoResponse (backend v4): plano y sin contraseñas. Para verlas
 * se pide `GET /equipos-computo/{id}/contrasenas`, que queda en la bitácora.
 */
export interface EquipoComputo extends DetalleTecnico {
  idEquipoComputo: number;
  inventario: string;
  serie: string | null;
  cantidad: number | null;
  caracteristicas: string | null;
  estado: EstadoEquipo;
  nombreArticulo: string;
  nombreMarca: string;
  nombreModelo: string;
  idSala: number | null;
  codigoSala: string | null;
  nombreSala: string | null;
  tieneContrasena: boolean;
  tieneUltimaContrasena: boolean;
  fechaCambioContrasena: IsoDateTime | null;
  ultimoUsuarioActualizacion: number | null;
  ultimoUsuarioActualizacionNombre: string | null;
  /** Quién registró el equipo base. */
  registradoPor: string | null;
  fechaRegistro: IsoDateTime | null;
  fechaActualizacion: IsoDateTime | null;
}

/** ContrasenasEquipoDTO: la actual y la anterior (la anterior pasa sola a "última"). */
export interface ContrasenasEquipo {
  inventario: string;
  contrasena: string | null;
  ultimaContrasena: string | null;
  fechaCambioContrasena: IsoDateTime | null;
}

/**
 * EquipoComputoRequest: crea o actualiza equipo base y detalle técnico.
 * `contrasena` solo se envía si cambia; `borrarContrasena` la quita.
 * El usuario que actualiza sale de la sesión.
 */
export interface EquipoComputoRequest extends Partial<DetalleTecnico> {
  idEquipoComputo?: number | null;
  inventario: string;
  nombreArticulo: string;
  nombreMarca: string;
  nombreModelo: string;
  serie?: string | null;
  cantidad?: number | null;
  caracteristicas?: string | null;
  estado?: EstadoEquipo | null;
  idSala?: number | null;
  contrasena?: string | null;
  borrarContrasena?: boolean;
  /** Nota que queda en la bitácora del equipo. */
  motivoCambio?: string | null;
}
