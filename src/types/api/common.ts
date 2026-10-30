/**
 * Tipos compartidos por los contratos de la API de Spring Boot.
 */

/**
 * Fecha y hora serializada por Jackson a partir de un `LocalDateTime`
 * (formato ISO 8601 sin zona horaria, por ejemplo "2026-10-30T09:00:00").
 */
export type IsoDateTime = string;

/** Fecha en formato `YYYY-MM-DD`. */
export type IsoDate = string;

/** Hora en formato `HH:mm`. */
export type HoraMinutos = string;

/**
 * Unión de valores conocidos que sigue aceptando cualquier otro texto.
 *
 * Se usa en campos que el backend guarda como `String` libre (no como enum):
 * el editor sugiere los valores conocidos, pero un valor nuevo enviado por
 * el backend no provoca un error de tipos.
 */
export type ValorConocido<T extends string> = T | (string & {});
