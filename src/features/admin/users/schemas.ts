import { z } from "zod";

import { passwordOpcionalSchema, passwordSchema } from "@/lib/validation/password";

const textoObligatorio = (campo: string, max: number) =>
  z
    .string()
    .max(max, `${campo}: máximo ${max} caracteres`)
    .refine((v) => v.trim().length > 0, `${campo} es obligatorio`);

/**
 * Esquema del formulario de usuario (Gestión de Usuarios).
 *
 * - Al crear, la contraseña es obligatoria.
 * - Al editar, "Nueva contraseña" es opcional: vacía conserva la actual
 *   (así lo maneja el backend en UsuarioUpdateRequest).
 * - En ambos casos, si se escribe una contraseña debe cumplir las reglas y
 *   coincidir con la confirmación.
 */
export function crearEsquemaUsuario(modo: "crear" | "editar") {
  return z
    .object({
      nombre: textoObligatorio("El nombre", 100),
      apellidos: textoObligatorio("Los apellidos", 100),
      correo: z
        .string()
        .max(255, "Correo: máximo 255 caracteres")
        .refine((v) => z.email().safeParse(v.trim()).success, "Escribe un correo válido"),
      idRol: z.number().int().min(1, "Selecciona un rol").max(4, "Selecciona un rol"),
      activo: z.boolean(),
      password: modo === "crear" ? passwordSchema : passwordOpcionalSchema,
      confirmarPassword: z.string(),
    })
    .superRefine((datos, ctx) => {
      if (datos.password !== datos.confirmarPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmarPassword"],
          message: "Las contraseñas no coinciden",
        });
      }
    });
}

export type UsuarioFormValues = z.infer<ReturnType<typeof crearEsquemaUsuario>>;
