import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

/*
 * Página temporal para validar la paleta y lucide-react.
 * Se reemplazará por la LandingPage migrada en la Fase 4.
 */

const swatches = [
  { name: "verde", className: "bg-verde text-white" },
  { name: "verde-hover", className: "bg-verde-hover text-white" },
  { name: "verde-claro", className: "bg-verde-claro text-verde-oscuro" },
  { name: "verde-oscuro", className: "bg-verde-oscuro text-superficie" },
  { name: "dorado", className: "bg-dorado text-dorado-oscuro" },
  { name: "dorado-claro", className: "bg-dorado-claro text-dorado-oscuro" },
  { name: "dorado-oscuro", className: "bg-dorado-oscuro text-dorado-claro" },
  { name: "superficie", className: "bg-superficie text-sobre-superficie border border-outline" },
  { name: "variante", className: "bg-variante text-sobre-variante" },
  { name: "outline", className: "bg-outline text-white" },
];

const estados = [
  { label: "Disponible", Icon: CheckCircle2, className: "bg-verde-claro text-verde-oscuro" },
  { label: "Mantenimiento", Icon: AlertTriangle, className: "bg-alerta-claro text-alerta-oscuro" },
  { label: "En uso", Icon: Info, className: "bg-info-claro text-info-oscuro" },
  { label: "Dañado", Icon: XCircle, className: "bg-error-claro text-error-oscuro" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-verde-oscuro text-superficie">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4 font-extrabold">
          <span className="h-2.5 w-2.5 rounded-full bg-dorado" />
          Control<span className="text-dorado">TIC</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-10">
        <section>
          <span className="text-xs font-semibold uppercase tracking-wider text-dorado-texto">
            Fase 3 · Validación
          </span>
          <h1 className="mt-1 text-3xl font-extrabold">Paleta institucional</h1>
          <p className="mt-1 text-sm text-sobre-variante">
            Si ves los colores y los iconos, Tailwind y lucide-react están configurados.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {swatches.map((s) => (
            <div key={s.name} className={`rounded-xl p-4 text-xs font-semibold ${s.className}`}>
              {s.name}
            </div>
          ))}
        </section>

        <section className="flex flex-wrap gap-3">
          {estados.map(({ label, Icon, className }) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${className}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </span>
          ))}
        </section>

        <section className="flex flex-wrap gap-3">
          <button className="rounded-xl bg-verde px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-verde-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado">
            Botón principal
          </button>
          <button className="rounded-xl border border-outline bg-white px-4 py-2.5 text-sm font-semibold text-sobre-variante transition-colors hover:bg-variante">
            Botón secundario
          </button>
          <button className="rounded-xl bg-error px-4 py-2.5 text-sm font-semibold text-white">
            Eliminar
          </button>
        </section>
      </main>
    </div>
  );
}
