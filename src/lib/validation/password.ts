import { z } from "zod";

/**
 * Reglas de contraseña (decisión 2026-10-30). El backend no valida
 * contraseñas, así que estas reglas solo se aplican en el frontend, al crear
 * o cambiar una contraseña. Las cuentas existentes no se ven afectadas.
 *
 * Cada regla se usa dos veces: para validar con zod y para mostrar la lista
 * de requisitos que se van cumpliendo mientras el usuario escribe.
 */
export const REGLAS_PASSWORD = [
  { id: "longitud", texto: "Entre 8 y 64 caracteres", cumple: (v: string) => v.length >= 8 && v.length <= 64 },
  { id: "mayuscula", texto: "Una letra mayúscula", cumple: (v: string) => /[A-ZÁÉÍÓÚÑ]/.test(v) },
  { id: "minuscula", texto: "Una letra minúscula", cumple: (v: string) => /[a-záéíóúñ]/.test(v) },
  { id: "numero", texto: "Un número", cumple: (v: string) => /\d/.test(v) },
  { id: "espacios", texto: "Sin espacios", cumple: (v: string) => v.length > 0 && !/\s/.test(v) },
] as const;

export function cumpleReglasPassword(valor: string): boolean {
  return REGLAS_PASSWORD.every((regla) => regla.cumple(valor));
}

const MENSAJE_REGLAS = "La contraseña no cumple todos los requisitos";

/** Esquema de una contraseña nueva obligatoria que cumple todas las reglas. */
export const passwordSchema = z
  .string()
  .min(1, "La contraseña es obligatoria")
  .refine(cumpleReglasPassword, MENSAJE_REGLAS);

/** Contraseña opcional: vacía se acepta (no se cambia); si se escribe, debe cumplir las reglas. */
export const passwordOpcionalSchema = z
  .string()
  .refine((v) => v === "" || cumpleReglasPassword(v), MENSAJE_REGLAS);

/**
 * Devuelve el primer requisito incumplido, o null si la contraseña es válida.
 * Útil en formularios que no usan zod directamente.
 */
export function validarPassword(valor: string): string | null {
  if (!valor) return "La contraseña es obligatoria";
  const fallida = REGLAS_PASSWORD.find((regla) => !regla.cumple(valor));
  return fallida ? `La contraseña debe tener: ${fallida.texto.toLowerCase()}` : null;
}
