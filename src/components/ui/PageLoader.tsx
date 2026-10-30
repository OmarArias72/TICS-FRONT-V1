import { LoaderCircle } from "lucide-react";

/** Indicador de carga a pantalla completa dentro del área principal. */
export function PageLoader({ label = "Cargando..." }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-sobre-variante"
    >
      <LoaderCircle className="h-8 w-8 animate-spin text-verde" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
