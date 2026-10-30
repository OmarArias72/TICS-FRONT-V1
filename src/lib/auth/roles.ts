import type { NombreRol } from "@/types/api";

import { tienePermiso, type Permiso } from "./permisos";

/**
 * Roles y acceso a rutas.
 *
 * Cada ruta protegida exige un permiso de lib/auth/permisos.ts. El guard de
 * rutas y el menú leen esta misma tabla, así que un enlace visible siempre
 * lleva a una ruta permitida.
 */

export const ROLES = {
  ADMIN: "Admin",
  OPERADOR: "Operador-tics",
  PROFESOR: "Profesor",
  ESTUDIANTE: "Estudiante",
} as const satisfies Record<string, NombreRol>;

/** Ids de la tabla `roles` (orden de inserción del DataSeeder). */
export const ID_ROL: Record<NombreRol, number> = {
  Admin: 1,
  "Operador-tics": 2,
  Profesor: 3,
  Estudiante: 4,
};

export type SeccionMenu = "principal" | "admin";

export interface RutaProtegida {
  href: string;
  /** Texto del enlace en el menú. Sin etiqueta, la ruta no aparece en el menú. */
  label?: string;
  seccion?: SeccionMenu;
  permiso: Permiso;
}

/**
 * Tabla de rutas protegidas. Una subruta sin entrada propia hereda la regla de
 * su ruta padre más específica.
 */
export const RUTAS_PROTEGIDAS: readonly RutaProtegida[] = [
  { href: "/aulas", label: "Mapa de Aulas", seccion: "principal", permiso: "salas.ver" },
  { href: "/inventario", label: "Inventario Total", seccion: "principal", permiso: "inventario.ver" },
  { href: "/inventario/conteo", permiso: "inventario.conteos" },
  {
    href: "/reservas",
    label: "Reserva de Salas",
    seccion: "principal",
    permiso: "reservas.reservar",
  },
  {
    href: "/solicitudes-tecnicas",
    label: "Mesa de Ayuda",
    seccion: "principal",
    permiso: "mesaAyuda.solicitar",
  },

  {
    href: "/admin/reservas",
    label: "Control de Reservas",
    seccion: "admin",
    permiso: "reservas.gestionar",
  },
  {
    href: "/admin/config-agenda",
    label: "Apertura / Cierre Agenda",
    seccion: "admin",
    permiso: "agenda.configurar",
  },
  {
    href: "/admin/solicitudes-tecnicas",
    label: "Panel Mesa de Ayuda",
    seccion: "admin",
    permiso: "mesaAyuda.atender",
  },
  {
    href: "/admin/usuarios",
    label: "Gestión de Usuarios",
    seccion: "admin",
    permiso: "usuarios.gestionar",
  },
];

/**
 * Página a la que llega cada rol al iniciar sesión: su sección principal.
 * Debe ser una ruta que el rol tenga permitida.
 */
export const INICIO_POR_ROL: Record<NombreRol, string> = {
  Admin: "/admin/reservas",
  "Operador-tics": "/inventario",
  Profesor: "/reservas",
  Estudiante: "/solicitudes-tecnicas",
};

function coincide(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Regla que aplica a una ruta: la de `href` más largo que la contenga.
 * Devuelve `undefined` si la ruta no está registrada como protegida.
 */
export function reglaDeRuta(pathname: string): RutaProtegida | undefined {
  return RUTAS_PROTEGIDAS.filter((ruta) => coincide(pathname, ruta.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
}

/**
 * Indica si un rol puede ver una ruta protegida. Una ruta sin regla
 * (dentro del grupo protegido) solo exige sesión iniciada.
 */
export function puedeAcceder(rol: NombreRol | undefined, pathname: string): boolean {
  if (!rol) return false;
  const regla = reglaDeRuta(pathname);
  return regla ? tienePermiso(rol, regla.permiso) : true;
}

/** Enlaces del menú visibles para un rol, en el orden de la tabla. */
export function enlacesDeMenu(rol: NombreRol | undefined, seccion: SeccionMenu) {
  if (!rol) return [];
  return RUTAS_PROTEGIDAS.filter(
    (ruta): ruta is RutaProtegida & { label: string } =>
      ruta.seccion === seccion && Boolean(ruta.label) && tienePermiso(rol, ruta.permiso),
  );
}

/**
 * Destino tras iniciar sesión.
 *
 * Usa `?next=` solo si es una ruta interna (evita redirecciones abiertas) y el
 * rol puede entrar en ella; si no, envía a la sección principal del rol en
 * lugar de mostrar "Acceso denegado" justo después del login.
 */
export function destinoTrasLogin(next: string | null, rol: NombreRol): string {
  const esInterna = next !== null && next.startsWith("/") && !next.startsWith("//");
  if (esInterna && next !== "/login" && puedeAcceder(rol, next)) {
    return next;
  }
  return INICIO_POR_ROL[rol];
}
