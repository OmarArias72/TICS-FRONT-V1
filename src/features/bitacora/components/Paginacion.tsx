import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui";

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  totalElementos: number;
  cargando?: boolean;
  onCambiar: (pagina: number) => void;
}

/** Pie de tabla con el total y botones Anterior / Siguiente (páginas desde 0). */
export function Paginacion({ pagina, totalPaginas, totalElementos, cargando, onCambiar }: PaginacionProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-variante px-6 py-3.5 text-[13px] text-sobre-variante">
      <span aria-live="polite">
        {totalElementos.toLocaleString("es-MX")} registro{totalElementos === 1 ? "" : "s"}
        {totalPaginas > 1 && ` · página ${pagina + 1} de ${totalPaginas}`}
      </span>
      {totalPaginas > 1 && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={pagina === 0 || cargando}
            icon={<ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={() => onCambiar(pagina - 1)}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={pagina + 1 >= totalPaginas || cargando}
            onClick={() => onCambiar(pagina + 1)}
          >
            Siguiente
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
