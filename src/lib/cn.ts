/**
 * Une clases de Tailwind ignorando valores vacíos o condicionales falsos.
 * Ejemplo: cn("px-4", activo && "bg-verde", className)
 */
export function cn(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(" ");
}
