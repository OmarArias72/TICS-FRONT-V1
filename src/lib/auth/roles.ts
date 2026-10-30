import type { NombreRol } from "@/types/api";

/**
 * Fuente única de roles y permisos por ruta.
 *
 * En el proyecto original estas reglas estaban duplicadas en AppRoutes.jsx y
 * NavBar.jsx, y no coincidían. Ahora el guard de rutas y el menú leen esta
 * misma tabla, de modo que un enlace visible siempre lleva a una ruta permitida.
 *
 * Importante: esto solo controla la interfaz. El backend no valida la sesión,
 * por lo que no sustituye a una autorización en el servidor.
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

const TODOS: readonly NombreRol[] = Object.values(ROLES);
const SOLO_ADMIN: readonly NombreRol[] = [ROLES.ADMIN];
const TICS: readonly NombreRol[] = [ROLES.ADMIN, ROLES.OPERADOR];
const RESERVAS: readonly NombreRol[] = [ROLES.ADMIN, ROLES.PROFESOR, ROLES.ESTUDIANTE];

export type SeccionMenu = "principal" | "admin";

export interface RutaProtegida {
  href: string;
  /** Texto del enlace en el menú. Sin etiqueta, la ruta no aparece en el menú. */
  label?: string;
  seccion?: SeccionMenu;
  roles: readonly NombreRol[];
}

/**
 * Tabla de rutas protegidas. Una subruta hereda la regla de su ruta padre
 * más específica (por ejemplo, /inventario/conteo usa la de /inventario).
 *
 * Decisión 2026-10-30: /admin/reservas y /admin/config-agenda son solo de Admin.
 */
export const RUTAS_PROTEGIDAS: readonly RutaProtegida[] = [
  { href: "/aulas", label: "Mapa de Aulas", seccion: "principal", roles: TODOS },
  { href: "/inventario", label: "Inventario Total", seccion: "principal", roles: TICS },
  { href: "/reservas", label: "Reserva de Salas", seccion: "principal", roles: RESERVAS },
  { href: "/solicitudes-tecnicas", label: "Mesa de Ayuda", seccion: "principal", roles: TODOS },

  { href: "/admin/usuarios", label: "Gestión de Usuarios", seccion: "admin", roles: SOLO_ADMIN },
  { href: "/admin/reservas", label: "Control de Reservas", seccion: "admin", roles: SOLO_ADMIN },
  {
    href: "/admin/config-agenda",
    label: "Apertura / Cierre Agenda",
    seccion: "admin",
    roles: SOLO_ADMIN,
  },
  {
    href: "/admin/solicitudes-tecnicas",
    label: "Panel Mesa de Ayuda",
    seccion: "admin",
    roles: TICS,
  },
];

/** Ruta a la que se envía al usuario tras iniciar sesión si no venía de otra. */
export const RUTA_INICIO_SESION = "/aulas";

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
  return regla ? regla.roles.includes(rol) : true;
}

/** Enlaces del menú visibles para un rol, en el orden de la tabla. */
export function enlacesDeMenu(rol: NombreRol | undefined, seccion: SeccionMenu) {
  if (!rol) return [];
  return RUTAS_PROTEGIDAS.filter(
    (ruta): ruta is RutaProtegida & { label: string } =>
      ruta.seccion === seccion && Boolean(ruta.label) && ruta.roles.includes(rol),
  );
}

/**
 * Valida el parámetro `?next=` del login para evitar redirecciones abiertas:
 * solo se aceptan rutas internas que empiecen por una sola barra.
 */
export function destinoSeguro(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return RUTA_INICIO_SESION;
}
