import type { NombreRol } from "@/types/api";

/**
 * Matriz de permisos por acción (definida el 2026-10-30).
 *
 * Cada permiso indica qué roles pueden realizar una acción concreta. Las
 * rutas (lib/auth/roles.ts) y los botones de cada pantalla consultan esta
 * misma tabla, de modo que lo que un rol ve en el menú coincide con lo que
 * puede hacer dentro de la página.
 *
 * Importante: esto controla solo la interfaz. El backend no valida la sesión
 * ni el rol, así que no sustituye a una autorización en el servidor.
 */

const ADMIN: NombreRol = "Admin";
const OPERADOR: NombreRol = "Operador-tics";
const PROFESOR: NombreRol = "Profesor";
const ESTUDIANTE: NombreRol = "Estudiante";

export const PERMISOS = {
  /* ---------- Mapa de aulas: salas ---------- */
  "salas.ver": [ADMIN, OPERADOR],
  /** Crear, editar y borrar salas. */
  "salas.gestionar": [ADMIN],

  /* ---------- Mapa de aulas: equipos de cómputo ---------- */
  "equipos.ver": [ADMIN, OPERADOR],
  /** Crear, editar y borrar equipos de cómputo. */
  "equipos.gestionar": [ADMIN, OPERADOR],
  /** Ver contraseñas de los equipos (contrasena, passwordAdmin, lastPassword). */
  "equipos.verContrasenas": [ADMIN, OPERADOR],

  /* ---------- Inventario ---------- */
  "inventario.ver": [ADMIN, OPERADOR],
  "inventario.crear": [ADMIN, OPERADOR],
  "inventario.editar": [ADMIN, OPERADOR],
  "inventario.eliminar": [ADMIN],
  /** Cambio de estado masivo a ALTA o MANTENIMIENTO. */
  "inventario.estadoMasivo": [ADMIN, OPERADOR],
  /** Dar de BAJA (individual o masivo): equivale a retirar el equipo. */
  "inventario.darDeBaja": [ADMIN],
  "inventario.conteos": [ADMIN, OPERADOR],
  "inventario.reportes": [ADMIN, OPERADOR],

  /* ---------- Reservas de salas ---------- */
  /** Reservar sala y consultar mis solicitudes. Opcional para Admin. */
  "reservas.reservar": [ADMIN, PROFESOR],
  /** Aprobar, rechazar, reasignar y cancelar reservas. */
  "reservas.gestionar": [ADMIN, OPERADOR],
  /** Apertura y cierre de la agenda. */
  "agenda.configurar": [ADMIN],

  /* ---------- Usuarios ---------- */
  "usuarios.gestionar": [ADMIN],

  /* ---------- Mesa de ayuda ---------- */
  /** Crear y consultar tickets propios. */
  "mesaAyuda.solicitar": [PROFESOR, ESTUDIANTE],
  /** Atender tickets: aprobar, rechazar, tomar, capturar y resolver. */
  "mesaAyuda.atender": [ADMIN, OPERADOR],
} as const satisfies Record<string, readonly NombreRol[]>;

export type Permiso = keyof typeof PERMISOS;

/** Indica si un rol tiene un permiso. Sin rol (sin sesión) siempre es `false`. */
export function tienePermiso(rol: NombreRol | null | undefined, permiso: Permiso): boolean {
  if (!rol) return false;
  return (PERMISOS[permiso] as readonly NombreRol[]).includes(rol);
}
