import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Bloques de las páginas informativas (Privacidad y Ayuda). Son Server
 * Components: solo texto, sin interacción salvo los `<details>` nativos.
 */

/** Encabezado de página informativa con icono grande. */
export function EncabezadoInfo({
  eyebrow,
  titulo,
  descripcion,
  Icono,
}: {
  eyebrow: string;
  titulo: string;
  descripcion: ReactNode;
  Icono: LucideIcon;
}) {
  return (
    <header className="flex flex-col gap-4 rounded-3xl bg-verde-oscuro px-6 py-8 text-superficie sm:flex-row sm:items-center sm:px-10">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-dorado text-dorado-oscuro">
        <Icono className="h-8 w-8" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-dorado">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{titulo}</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-verde-claro">{descripcion}</p>
      </div>
    </header>
  );
}

/** Sección con título numerado o con icono. */
export function SeccionInfo({
  id,
  titulo,
  Icono,
  children,
}: {
  id: string;
  titulo: string;
  Icono: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24">
      <h2 id={id} className="mb-4 flex items-center gap-3 text-xl font-extrabold text-sobre-superficie">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-verde text-white">
          <Icono className="h-5 w-5" aria-hidden="true" />
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/** Tarjeta con icono, título y texto. */
export function TarjetaInfo({
  Icono,
  titulo,
  children,
  tono = "neutro",
}: {
  Icono: LucideIcon;
  titulo: string;
  children: ReactNode;
  tono?: "neutro" | "verde" | "dorado" | "info";
}) {
  const estilos = {
    neutro: { caja: "border-variante bg-white", icono: "bg-verde-claro/60 text-verde" },
    verde: { caja: "border-verde/25 bg-verde-claro/30", icono: "bg-verde text-white" },
    dorado: { caja: "border-dorado/30 bg-dorado-claro", icono: "bg-dorado text-dorado-oscuro" },
    info: { caja: "border-info/25 bg-info-claro/60", icono: "bg-info text-white" },
  }[tono];
  return (
    <div className={cn("flex h-full gap-3.5 rounded-2xl border p-5", estilos.caja)}>
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", estilos.icono)}>
        <Icono className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-extrabold text-sobre-superficie">{titulo}</h3>
        <div className="mt-1.5 text-sm leading-relaxed text-sobre-variante">{children}</div>
      </div>
    </div>
  );
}

/** Pregunta frecuente desplegable (elemento nativo `<details>`, accesible por teclado). */
export function Pregunta({ pregunta, children }: { pregunta: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-variante bg-white open:border-verde/40 open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 text-[15px] font-bold text-sobre-superficie hover:bg-superficie focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado [&::-webkit-details-marker]:hidden">
        {pregunta}
        <ChevronDown className="h-5 w-5 shrink-0 text-verde transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="px-5 pb-5 text-sm leading-relaxed text-sobre-variante">{children}</div>
    </details>
  );
}

/** Lista con viñetas en verde. */
export function ListaInfo({ elementos }: { elementos: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {elementos.map((e, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-verde" aria-hidden="true" />
          <span>{e}</span>
        </li>
      ))}
    </ul>
  );
}
