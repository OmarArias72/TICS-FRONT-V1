import { z } from "zod";

export const ESTADOS_EQUIPO = ["ALTA", "MANTENIMIENTO", "BAJA"] as const;

const opcional = (campo: string, max: number) =>
  z.string().max(max, `${campo}: máximo ${max} caracteres`);

const obligatorio = (campo: string, max: number) =>
  opcional(campo, max).refine((v) => v.trim().length > 0, `${campo} es obligatorio`);

/**
 * Formulario de equipo del inventario (EquipoCreateRequest).
 *
 * Marca y modelo son opcionales: si llegan vacíos, el backend registra
 * "GENÉRICA" / "GENÉRICO" al crear y conserva los actuales al editar.
 */
export const equipoSchema = z.object({
  inventario: obligatorio("El número de inventario", 100),
  serie: opcional("Serie", 100),
  nombreArticulo: obligatorio("El artículo", 255),
  nombreMarca: opcional("Marca", 255),
  nombreModelo: opcional("Modelo", 255),
  cantidad: z
    .number({ error: "Escribe una cantidad" })
    .int("La cantidad debe ser un número entero")
    .min(1, "La cantidad mínima es 1"),
  caracteristicas: opcional("Características", 2000),
  estado: z.enum(ESTADOS_EQUIPO, { error: "Selecciona un estado" }),
});

export type EquipoFormValues = z.infer<typeof equipoSchema>;

/** Filtros del modal de reporte; la fecha final no puede ser anterior a la inicial. */
export const reporteSchema = z
  .object({
    fechaInicio: z.string(),
    fechaFin: z.string(),
    articulo: opcional("Artículo", 255),
    formato: z.enum(["pdf", "csv"]),
  })
  .superRefine((datos, ctx) => {
    if (datos.fechaInicio && datos.fechaFin && datos.fechaFin < datos.fechaInicio) {
      ctx.addIssue({
        code: "custom",
        path: ["fechaFin"],
        message: "La fecha final no puede ser anterior a la inicial",
      });
    }
  });

export type ReporteFormValues = z.infer<typeof reporteSchema>;
