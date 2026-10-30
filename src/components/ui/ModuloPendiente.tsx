import { Construction } from "lucide-react";

/**
 * Marcador temporal para rutas cuyo módulo aún no se migra.
 * Permite probar la navegación y los permisos antes de migrar cada pantalla.
 */
export function ModuloPendiente({ titulo }: { titulo: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-dorado/40 bg-dorado-claro p-8 text-center">
        <Construction className="mx-auto mb-4 h-10 w-10 text-dorado-oscuro" aria-hidden="true" />
        <h1 className="text-xl font-extrabold text-dorado-oscuro">{titulo}</h1>
        <p className="mt-2 text-sm text-dorado-oscuro/80">
          Este módulo está en proceso de migración a Next.js.
        </p>
      </div>
    </div>
  );
}
