/** Pie de página. No tiene interacción, así que se queda como Server Component. */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-verde-oscuro bg-verde-oscuro py-8 text-verde-claro">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-xs sm:text-sm md:flex-row">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-dorado" aria-hidden="true" />
          <span className="font-semibold text-superficie">UAEMéx - Gestión de Tecnologías</span>
        </div>

        <p>
          Ciclo Escolar - Segunda Etapa |{" "}
          <a
            href="https://www.uaemex.mx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dorado underline decoration-dorado/40 underline-offset-4 transition-colors hover:text-dorado-claro"
          >
            www.uaemex.mx
          </a>
        </p>
      </div>
    </footer>
  );
}
