import Link from "next/link";

import { cardClass, primaryButtonClass } from "@/components/ui/styles";

/** Página 404 (antes NotFoundPage.jsx). Next.js la usa para cualquier ruta inexistente. */
export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className={`${cardClass} max-w-md text-center`}>
        <p className="mb-3 text-7xl font-extrabold text-verde">404</p>
        <h1 className="mb-2 text-xl font-extrabold text-sobre-superficie">Página no encontrada</h1>
        <p className="mb-6 text-sm text-sobre-variante">La ruta que buscas no existe o fue movida.</p>
        <Link href="/" className={`${primaryButtonClass} w-full py-2.5`}>
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
