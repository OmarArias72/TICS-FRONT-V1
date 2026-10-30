import { z } from "zod";

/** Validaciones iguales a las de SolicitudTecnicaService.validarFormulario. */
export const REGEX_CURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** El motivo es obligatorio para el tipo "OTRO"; eso se valida al enviar, con el catálogo. */
export const crearSolicitudSchema = z.object({
  idTipo: z.string().min(1, "Elige qué necesitas"),
  motivo: z.string().trim().max(1000, "Máximo 1000 caracteres"),
});
export type CrearSolicitudValues = z.infer<typeof crearSolicitudSchema>;

export const formularioSchema = z.object({
  nombreCompleto: z.string().trim().min(5, "Escribe tu nombre completo").max(150, "Máximo 150 caracteres"),
  correoInstitucional: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => REGEX_CORREO.test(v) && v.endsWith("@uaemex.mx"), "Debe ser tu correo @uaemex.mx"),
  correoAlterno: z
    .string()
    .trim()
    .refine((v) => v === "" || REGEX_CORREO.test(v), "Correo no válido"),
  numeroCuenta: z.string().trim().regex(/^\d{7}$/, "El número de cuenta tiene 7 dígitos"),
  curp: z.string().trim().toUpperCase().regex(REGEX_CURP, "Revisa tu CURP: 18 caracteres como en tu documento"),
  telefono: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{10}$/.test(v), "Escribe 10 dígitos, sin espacios"),
  descripcionProblema: z.string().trim().max(1000, "Máximo 1000 caracteres"),
});
export type FormularioValues = z.infer<typeof formularioSchema>;

export const reenviarSchema = z.object({
  motivo: z.string().trim().min(10, "Explica con más detalle (al menos 10 caracteres)").max(1000, "Máximo 1000 caracteres"),
});
export type ReenviarValues = z.infer<typeof reenviarSchema>;

export const codigoTicketSchema = z.object({
  codigo: z.string().trim().min(1, "Escribe el ID del ticket").max(50, "Máximo 50 caracteres"),
});
export type CodigoTicketValues = z.infer<typeof codigoTicketSchema>;
