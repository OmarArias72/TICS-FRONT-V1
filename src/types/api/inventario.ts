import type { IsoDateTime, ValorConocido } from "./common";
import type { Sala } from "./sala";

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
}

/** EquipoMovilCreate: alta desde la app móvil (incluye bitácora). */
export interface EquipoMovilCreate extends EquipoCreateRequest {
  idUsuario: number;
  observacion?: string | null;
}

/** BusquedaRequest: cuerpo de los endpoints `buscar-*`. */
export interface BusquedaRequest {
  query: string;
}

/** ActualizarEstadoMasivoRequest. */
export interface ActualizarEstadoMasivoRequest {
  inventarios: string[];
  nuevoEstado: EstadoEquipo;
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

/** Filtros opcionales de los reportes PDF y CSV. */
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

/** Valores válidos según los CHECK de la base de datos. */
export type EstadoTeclado = ValorConocido<
  "Bueno" | "Teclas dañadas" | "Teclas faltantes" | "Sin respuesta" | "Cable dañado" | "Dañado"
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

interface Articulo {
  idArticulo: number;
  nombreArticulo: string;
}

interface Marca {
  idMarca: number;
  nombreMarca: string;
}

interface Modelo {
  idModelo: number;
  nombreModelo: string;
  marca: Marca;
}

/** Entidad `Equipo` anidada dentro de `EquipoComputo`. */
export interface EquipoBase {
  inventario: string;
  articulo: Articulo;
  modelo: Modelo;
  serie: string | null;
  cantidad: number | null;
  caracteristicas: string | null;
  estado: EstadoEquipo;
  fechaRegistro: IsoDateTime | null;
  fechaActualizacion: IsoDateTime | null;
}

/** Campos técnicos comunes a la entidad y al request. */
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
  contrasena: string | null;
  passwordAdmin: string | null;
  lastPassword: string | null;
  estadoCpu: EstadoCpu | null;
  estadoComputadora: EstadoComputadora | null;
  observaciones: string | null;
  ultimoUsuarioActualizacion: number | null;
}

/**
 * Entidad `EquipoComputo`. Los GET de `/equipos-computo` devuelven la entidad
 * JPA tal cual (no el EquipoComputoResponse aplanado), con `equipo` y `sala`
 * anidados.
 */
export interface EquipoComputo extends DetalleTecnico {
  idEquipoComputo: number;
  equipo: EquipoBase;
  /** Relación LAZY en el backend: puede llegar nula. */
  sala: Sala | null;
  fechaRegistro: IsoDateTime | null;
  fechaActualizacion: IsoDateTime | null;
}

/** EquipoComputoRequest: crea o actualiza equipo base y detalle técnico. */
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
}
