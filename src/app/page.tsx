import { LandingSessionActions } from "@/features/landing/LandingSessionActions";

/** Portada (antes LandingPage.jsx). El texto se renderiza en el servidor. */
export default function LandingPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-superficie to-variante/60 px-4 py-12 sm:px-6 lg:px-8">
      {/* Círculos decorativos */}
      <div
        className="pointer-events-none absolute left-[-5%] top-[-5%] h-72 w-72 rounded-full border-2 border-verde/20 bg-verde-claro/30 blur-sm sm:h-96 sm:w-96"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-10%] right-[-5%] h-80 w-80 rounded-full border-2 border-dorado/30 bg-dorado-claro/50 blur-sm sm:h-[32rem] sm:w-[32rem]"
        aria-hidden="true"
      />

      <div className="z-10 my-auto w-full max-w-3xl text-center">
        <span className="mb-6 inline-block rounded-full border border-verde/20 bg-verde-claro/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-verde-oscuro sm:text-sm">
          Universidad Autónoma del Estado de México
        </span>

        <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-sobre-superficie sm:text-6xl md:text-7xl">
          Gestión inteligente de <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-verde to-dorado-texto bg-clip-text text-transparent">
            Infraestructura &amp; TIC
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-sobre-variante sm:text-lg md:text-xl">
          Plataforma centralizada para la reserva de salas, seguimiento de equipos e inventario
          institucional.
        </p>

        <LandingSessionActions />
      </div>
    </div>
  );
}
