import { z } from "zod";

const texto = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);
const obligatorio = (mensaje: string, max: number) => texto(max).min(1, mensaje);

/** SalaDTO. El backend exige el código y que no se repita. */
export const salaSchema = z.object({
  codigoSala: obligatorio("Escribe el código de la sala", 50),
  nombre: texto(100),
  ubicacion: texto(255),
  descripcion: texto(2000),
});
export type SalaValues = z.infer<typeof salaSchema>;

/**
 * EquipoComputoRequest. Inventario, artículo, marca y modelo son
 * obligatorios en el backend (los busca o los crea por nombre).
 */
export const equipoComputoSchema = z.object({
  inventario: obligatorio("Escribe el número de inventario", 100),
  serie: texto(100),
  nombreArticulo: obligatorio("Escribe el artículo", 255),
  nombreMarca: obligatorio("Escribe la marca", 255),
  nombreModelo: obligatorio("Escribe el modelo", 255),
  caracteristicas: texto(2000),
  estado: z.enum(["ALTA", "MANTENIMIENTO", "BAJA"]),
  idSala: z.string().min(1, "Elige una sala"),

  procesador: texto(100),
  ram: texto(50),
  almacenamiento: texto(100),
  especificacionesHardware: texto(2000),
  sistemaOperativo: texto(100),
  softwareInstalado: texto(4000),

  estadoTeclado: z.string(),
  estadoMouse: z.string(),
  estadoMonitor: z.string(),
  estadoCableEthernet: z.string(),
  estadoCpu: z.string(),
  estadoComputadora: z.string(),

  contrasena: texto(255),
  passwordAdmin: texto(255),
  lastPassword: texto(255),
  observaciones: texto(2000),
});
export type EquipoComputoValues = z.infer<typeof equipoComputoSchema>;
