import type { EstadoVisual } from "@/lib/estados";
import type { AccionBitacora, OrigenBitacora } from "@/types/api";

/** Nombre legible del módulo que hizo el cambio. */
export const ORIGENES: Record<string, string> = {
  INVENTARIO: "Inventario",
  EQUIPO_COMPUTO: "Mapa de Aulas",
  MANTENIMIENTO: "Mantenimientos",
  APP_MOVIL: "App móvil",
};

export const nombreOrigen = (o: OrigenBitacora | null | undefined) => (o ? (ORIGENES[o] ?? o) : "—");

/** Acciones de la bitácora de equipos con su etiqueta y tono. */
const ACCIONES: Record<string, EstadoVisual> = {
  ALTA: { tono: "ok", etiqueta: "Registro" },
  ALTA_MOVIL: { tono: "ok", etiqueta: "Registro (app móvil)" },
  ALTA_DETALLE_COMPUTO: { tono: "ok", etiqueta: "Registro de equipo de cómputo" },
  ACTUALIZAR: { tono: "info", etiqueta: "Modificación" },
  CAMBIO_ESTADO: { tono: "alerta", etiqueta: "Cambio de estado" },
  CAMBIO_ESTADO_MASIVO: { tono: "alerta", etiqueta: "Cambio de estado masivo" },
  CAMBIO_CONTRASENA: { tono: "dorado", etiqueta: "Cambio de contraseña" },
  VER_CONTRASENA: { tono: "dorado", etiqueta: "Consulta de contraseñas" },
  MANTENIMIENTO_REGISTRADO: { tono: "info", etiqueta: "Mantenimiento registrado" },
  MANTENIMIENTO_FINALIZADO: { tono: "ok", etiqueta: "Mantenimiento finalizado" },
  MANTENIMIENTO_CANCELADO: { tono: "neutro", etiqueta: "Mantenimiento cancelado" },
  ELIMINAR: { tono: "error", etiqueta: "Eliminación" },
};

export function accionBitacora(accion: AccionBitacora): EstadoVisual {
  return ACCIONES[accion] ?? { tono: "neutro", etiqueta: accion };
}

/** Campos que guarda el backend (BitacoraService.foto) con su nombre para el usuario. */
const CAMPOS: Record<string, string> = {
  articulo: "Artículo",
  marca: "Marca",
  modelo: "Modelo",
  serie: "Serie",
  cantidad: "Cantidad",
  caracteristicas: "Características",
  estado: "Estado",
  sala: "Sala",
  especificacionesHardware: "Especificaciones",
  sistemaOperativo: "Sistema operativo",
  softwareInstalado: "Software",
  estadoTeclado: "Teclado",
  estadoMouse: "Mouse",
  estadoCableEthernet: "Cable de red",
  estadoMonitor: "Monitor",
  estadoCpu: "CPU",
  estadoComputadora: "Estado de la PC",
  procesador: "Procesador",
  ram: "RAM",
  almacenamiento: "Almacenamiento",
  observaciones: "Observaciones",
  contrasena: "Contraseña",
  mantenimiento: "Mantenimiento",
  DETALLE_TECNICO: "Detalle técnico",
};

export const nombreCampo = (campo: string | null) => (campo ? (CAMPOS[campo] ?? campo) : null);

/** Convierte "articulo=CPU; marca=DELL" en pares legibles para mostrar un alta o una baja. */
export function resumenAPares(resumen: string | null): Array<[string, string]> {
  if (!resumen) return [];
  return resumen
    .split("; ")
    .map((par) => {
      const i = par.indexOf("=");
      return i > 0 ? ([nombreCampo(par.slice(0, i)) ?? par, par.slice(i + 1)] as [string, string]) : null;
    })
    .filter((p): p is [string, string] => p !== null);
}

/** Etiqueta legible de una acción de la auditoría (acción + entidad tal cual vienen del backend). */
export function accionAuditoria(accion: string): EstadoVisual {
  if (accion.startsWith("LOGIN_FALLIDO") || accion.includes("BLOQUEO") || accion.startsWith("ELIMINAR")) {
    return { tono: "error", etiqueta: accion };
  }
  if (accion.startsWith("CREAR") || accion === "REGISTRO" || accion.startsWith("APROBAR")) {
    return { tono: "ok", etiqueta: accion };
  }
  if (accion.startsWith("VER_") || accion.startsWith("EXPORTAR") || accion === "GENERAR_REPORTE") {
    return { tono: "dorado", etiqueta: accion };
  }
  if (accion === "LOGIN" || accion === "LOGOUT") return { tono: "neutro", etiqueta: accion };
  return { tono: "info", etiqueta: accion };
}
