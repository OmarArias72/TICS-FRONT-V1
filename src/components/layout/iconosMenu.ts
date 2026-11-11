import {
  Boxes,
  CalendarCheck,
  CalendarCog,
  CalendarPlus,
  Circle,
  Headset,
  LifeBuoy,
  School,
  ScrollText,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

/**
 * Icono de cada enlace del menú lateral, por `href` de `RUTAS_PROTEGIDAS`
 * (lib/auth/roles.ts). Se guardan aquí para que la tabla de rutas, que también
 * usa el guard, no dependa de componentes de React.
 */
const ICONOS: Record<string, LucideIcon> = {
  /** Salas y PCs de cada aula. */
  "/aulas": School,
  /** Equipos y artículos del inventario. */
  "/inventario": Boxes,
  /** Apartar una sala en la agenda. */
  "/reservas": CalendarPlus,
  /** Pedir ayuda a TIC (contraseña, autenticador...). */
  "/solicitudes-tecnicas": LifeBuoy,
  /** Aprobar, reasignar y cancelar reservas. */
  "/admin/reservas": CalendarCheck,
  /** Abrir o cerrar la agenda de reservas. */
  "/admin/config-agenda": CalendarCog,
  /** Atender las solicitudes y los tickets. */
  "/admin/solicitudes-tecnicas": Headset,
  /** Altas, roles y bajas de usuarios. */
  "/admin/usuarios": UsersRound,
  /** Historial de cambios (quién hizo qué). */
  "/admin/bitacora": ScrollText,
};

/** Icono del enlace; un punto si la ruta todavía no tiene uno asignado. */
export function iconoDeRuta(href: string): LucideIcon {
  return ICONOS[href] ?? Circle;
}
