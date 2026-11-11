import { z } from "zod";

/** Validaciones iguales a las del backend v4 (SolicitudTecnicaService). */
export const REGEX_CURP = /^[A-Z]{4}\d{6}[HMX][A-Z]{5}[A-Z0-9]\d$/;

/** Dominios institucionales permitidos (`app.correo.dominios-permitidos`). */
export const DOMINIOS_INSTITUCIONALES = ["uaemex.mx", "alumno.uaemex.mx"] as const;
const esInstitucional = (correo: string) => DOMINIOS_INSTITUCIONALES.some((d) => correo.endsWith(`@${d}`));
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** El motivo es obligatorio para el tipo "OTRO"; eso se valida al enviar, con el catálogo. */
export const crearSolicitudSchema = z.object({
  idTipo: z.string().min(1, "Elige qué necesitas"),
  motivo: z.string().trim().max(1000, "Máximo 1000 caracteres"),
});
export type CrearSolicitudValues = z.infer<typeof crearSolicitudSchema>;

/** Todos los campos son obligatorios en el backend v4. */
export const formularioSchema = z
  .object({
    nombreCompleto: z.string().trim().min(5, "Escribe tu nombre completo").max(150, "Máximo 150 caracteres"),
    correoInstitucional: z
      .string()
      .trim()
      .toLowerCase()
      .refine(
        (v) => REGEX_CORREO.test(v) && esInstitucional(v),
        "Debe ser tu correo institucional (@uaemex.mx o @alumno.uaemex.mx)",
      ),
    correoAlterno: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Escribe un correo alterno")
      .max(150, "Máximo 150 caracteres")
      .refine((v) => REGEX_CORREO.test(v), "Correo no válido"),
    numeroCuenta: z.string().trim().regex(/^\d{7}$/, "El número de cuenta tiene 7 dígitos"),
    curp: z.string().trim().toUpperCase().regex(REGEX_CURP, "Revisa tu CURP: 18 caracteres como en tu documento"),
    telefono: z.string().trim().regex(/^\d{10}$/, "Escribe 10 dígitos, sin espacios"),
    descripcionProblema: z.string().trim().min(5, "Describe el problema").max(2000, "Máximo 2000 caracteres"),
  })
  .refine((v) => v.correoAlterno !== v.correoInstitucional, {
    path: ["correoAlterno"],
    message: "Debe ser distinto de tu correo institucional",
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

/** Solicitud externa: datos básicos que captura TIC (el resto lo llena la persona). */
export const solicitudExternaSchema = z.object({
  nombre: z.string().trim().min(3, "Escribe el nombre de la persona").max(150, "Máximo 150 caracteres"),
  correoAlterno: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Máximo 254 caracteres")
    .refine((v) => REGEX_CORREO.test(v), "Correo no válido")
    .refine((v) => !esInstitucional(v), "Usa su correo alterno (Gmail, Outlook...), no el institucional"),
  idTipo: z.string().min(1, "Elige el tipo de solicitud"),
  motivo: z.string().trim().min(5, "Describe brevemente qué necesita").max(1000, "Máximo 1000 caracteres"),
});
export type SolicitudExternaValues = z.infer<typeof solicitudExternaSchema>;

/** Corregir el correo al reenviar el enlace (vacío = el mismo). */
export const reenviarEnlaceSchema = z.object({
  correoAlterno: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Máximo 254 caracteres")
    .refine((v) => v === "" || REGEX_CORREO.test(v), "Correo no válido")
    .refine((v) => v === "" || !esInstitucional(v), "Usa un correo alterno, no el institucional"),
});
export type ReenviarEnlaceValues = z.infer<typeof reenviarEnlaceSchema>;
