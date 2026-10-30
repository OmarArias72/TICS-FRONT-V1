import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Texto pequeño sobre el título (sección o módulo). */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Botones o enlaces alineados a la derecha. */
  actions?: ReactNode;
}

/** Encabezado estándar de cada pantalla: sección, título, descripción y acciones. */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-dorado-texto">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-1 text-3xl font-extrabold text-sobre-superficie">{title}</h1>
        {description && <p className="mt-1.5 text-[15px] text-sobre-variante">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

/** Contenedor de página: ancho máximo y márgenes comunes. */
export function PageContainer({
  children,
  narrow = false,
}: {
  children: ReactNode;
  /** Ancho reducido para pantallas de lectura, como Mesa de Ayuda. */
  narrow?: boolean;
}) {
  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col gap-6 px-4 pb-12 pt-8 sm:px-6 ${
        narrow ? "max-w-4xl" : "max-w-7xl"
      }`}
    >
      {children}
    </div>
  );
}
