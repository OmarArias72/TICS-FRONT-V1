"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Inbox, ListChecks, Mail, MailPlus, MailSearch, MousePointerClick, Search } from "lucide-react";

import {
  Alert,
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  PageContainer,
  PageHeader,
  StatusBadge,
  buttonClasses,
} from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { solicitudTecnicaService } from "@/lib/api/services";
import { cn } from "@/lib/cn";
import { estadoSolicitudTecnica } from "@/lib/estados";
import { formatearFecha } from "@/lib/fechas";
import { useAuthStore } from "@/store/authStore";
import type { EstadoSolicitudTecnica, SolicitudTecnica } from "@/types/api";

import { BuzonPanel } from "./BuzonPanel";
import { CrearSolicitudExternaModal } from "./CrearSolicitudExternaModal";
import { clavesMesaAyuda, URL_SERVICEDESK } from "./claves";
import { DetalleAtencion } from "./DetalleAtencion";
import { EtiquetaExterna } from "./EtiquetaExterna";
import { nombreTipo } from "./flujo";
import { ProcesarCorreoModal } from "./ProcesarCorreoModal";

type Bandeja = "REVISAR" | "TICKET" | "EN_TICS" | "EXTERNAS" | "TODAS";
type Vista = "SOLICITUDES" | "BUZON";

/** Bandejas del panel. "Listas para ticket" equivale al filtro SIN_ID del backend. */
const BANDEJAS: Array<{
  valor: Bandeja;
  etiqueta: string;
  estados: EstadoSolicitudTecnica[] | null;
  soloExternas?: boolean;
}> = [
  { valor: "REVISAR", etiqueta: "Por revisar", estados: ["PENDIENTE"] },
  { valor: "TICKET", etiqueta: "Listas para ticket", estados: ["APROBADA", "FORMULARIO_ENVIADO", "ESPERA_TICKET"] },
  { valor: "EN_TICS", etiqueta: "Ticket en TICS", estados: ["TICKET_CREADO"] },
  // Abiertas por TIC para alguien sin acceso a su correo institucional (cualquier estado)
  { valor: "EXTERNAS", etiqueta: "Externas", estados: null, soloExternas: true },
  { valor: "TODAS", etiqueta: "Todas", estados: null },
];

/** Refresco automático, como en el original. */
const INTERVALO_MS = 30_000;

/**
 * Panel Mesa de Ayuda para Admin y Operador (antes
 * AdminSolicitudesTecnicasPage.jsx). Permiso: "mesaAyuda.atender".
 *
 * Decisión 2026-10-30: lista a la izquierda y detalle con acciones a la
 * derecha. Se pide una sola vez el filtro TODAS y las bandejas se calculan
 * aquí, así cada pestaña muestra su contador.
 */
export function PanelMesaAyudaPage() {
  const idUsuarioActual = useAuthStore((s) => s.user?.idUsuario);
  const [procesandoCorreo, setProcesandoCorreo] = useState(false);
  const [creandoExterna, setCreandoExterna] = useState(false);
  const [vista, setVista] = useState<Vista>("SOLICITUDES");
  const [bandeja, setBandeja] = useState<Bandeja>("REVISAR");
  const [busqueda, setBusqueda] = useState("");
  const termino = useDebouncedValue(busqueda.trim().toLowerCase(), 200);
  const [idSeleccionada, setIdSeleccionada] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Mismo dato que la pestaña Buzón (comparten caché): contador de correos sin asociar
  const estadoBuzon = useQuery({
    queryKey: clavesMesaAyuda.estadoBuzon,
    queryFn: solicitudTecnicaService.estadoBuzon,
    refetchInterval: 60_000,
  });
  const pendientesBuzon = estadoBuzon.data?.pendientesDeAsociar ?? 0;

  const query = useQuery({
    queryKey: clavesMesaAyuda.panel,
    queryFn: () => solicitudTecnicaService.panelAdmin("TODAS"),
    refetchInterval: INTERVALO_MS,
  });
  const todas = query.data ?? [];

  const enBandeja = (b: (typeof BANDEJAS)[number], s: SolicitudTecnica) =>
    (!b.soloExternas || s.externa) && (b.estados === null || b.estados.includes(s.estado));
  const actual = BANDEJAS.find((b) => b.valor === bandeja)!;
  const visibles = todas
    .filter((s) => enBandeja(actual, s))
    .filter(
      (s) =>
        !termino ||
        s.nombreUsuario.toLowerCase().includes(termino) ||
        s.correoUsuario.toLowerCase().includes(termino) ||
        String(s.idSolicitud) === termino.replace("#", ""),
    )
    // Las bandejas de trabajo se atienden de la más antigua a la más reciente.
    .sort((a, b) =>
      bandeja === "TODAS"
        ? b.fechaSolicitud.localeCompare(a.fechaSolicitud)
        : a.fechaSolicitud.localeCompare(b.fechaSolicitud),
    );
  const seleccionada = todas.find((s) => s.idSolicitud === idSeleccionada) ?? null;

  const seleccionar = (id: number) => {
    setIdSeleccionada(id);
    // En pantallas angostas el detalle queda debajo de la lista.
    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  /** Desde el buzón o "Procesar correo": abre la solicitud en la lista. */
  const abrirSolicitud = (id: number) => {
    setVista("SOLICITUDES");
    setBandeja("TODAS");
    setBusqueda("");
    seleccionar(id);
  };

  if (idUsuarioActual === undefined) return null;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Administración TIC"
        title="Panel Mesa de Ayuda"
        description="Revisa las solicitudes, captura los tickets de ServiceDesk y ciérralas al resolverse."
        actions={
          <>
            <Button icon={<MailPlus className="h-4 w-4" aria-hidden="true" />} onClick={() => setCreandoExterna(true)}>
              Solicitud externa
            </Button>
            <Button
              variant="secondary"
              icon={<MailSearch className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setProcesandoCorreo(true)}
            >
              Procesar correo
            </Button>
            <a href={URL_SERVICEDESK} target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary")}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Abrir ServiceDesk TICS
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </>
        }
      />

      <div role="tablist" aria-label="Sección del panel" className="flex gap-1 border-b border-variante">
        {(
          [
            { valor: "SOLICITUDES", etiqueta: "Solicitudes", icono: ListChecks },
            { valor: "BUZON", etiqueta: "Buzón de correo", icono: Mail },
          ] as const
        ).map((t) => {
          const activa = vista === t.valor;
          const Icono = t.icono;
          return (
            <button
              key={t.valor}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => setVista(t.valor)}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado",
                activa ? "border-verde text-verde" : "border-transparent text-sobre-variante hover:text-sobre-superficie",
              )}
            >
              <Icono className="h-4 w-4" aria-hidden="true" />
              {t.etiqueta}
              {t.valor === "BUZON" && pendientesBuzon > 0 && (
                <span className="rounded-full bg-alerta-claro px-2 text-xs text-alerta-oscuro" title="Correos sin asociar">
                  {pendientesBuzon}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {vista === "BUZON" ? (
        <BuzonPanel onAbrirSolicitud={abrirSolicitud} />
      ) : (
      <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div role="group" aria-label="Bandeja" className="flex flex-wrap gap-2">
          {BANDEJAS.map((b) => {
            const cantidad = todas.filter((s) => enBandeja(b, s)).length;
            const activa = bandeja === b.valor;
            return (
              <button
                key={b.valor}
                type="button"
                aria-pressed={activa}
                onClick={() => setBandeja(b.valor)}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado",
                  activa ? "border-verde bg-verde text-white" : "border-variante bg-white text-sobre-variante hover:border-verde/50",
                )}
              >
                {b.etiqueta}
                <span className={cn("rounded-full px-2 text-xs", activa ? "bg-white/20" : "bg-variante")}>{cantidad}</span>
              </button>
            );
          })}
        </div>
        <div className="flex w-full flex-col gap-1 sm:w-72">
          <Label htmlFor="buscar-solicitud">Buscar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" aria-hidden="true" />
            <Input
              id="buscar-solicitud"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, correo o #folio"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-label="Solicitudes" className="flex min-w-0 flex-[1_1_340px] flex-col gap-3">
          {query.isPending ? (
            <p className="text-sm text-sobre-variante">Cargando solicitudes...</p>
          ) : query.isError ? (
            <Alert tone="error">{query.error.message}</Alert>
          ) : visibles.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-8 w-8" aria-hidden="true" />}
              title={termino ? "Sin resultados" : "No hay solicitudes en esta bandeja"}
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {visibles.map((s) => {
                const activa = s.idSolicitud === idSeleccionada;
                return (
                  <li key={s.idSolicitud}>
                    <button
                      type="button"
                      aria-pressed={activa}
                      onClick={() => seleccionar(s.idSolicitud)}
                      className={cn(
                        "flex w-full flex-col gap-2 rounded-2xl border bg-white px-4 py-3.5 text-left transition-colors",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado focus-visible:ring-offset-2",
                        activa ? "border-2 border-verde" : "border-variante hover:border-verde/50",
                      )}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold tracking-[0.06em] text-dorado-texto">
                            #{s.idSolicitud} · {nombreTipo(s.tipoNombre)}
                            {s.externa && <EtiquetaExterna />}
                          </span>
                          <span className="mt-0.5 block truncate font-extrabold">{s.nombreUsuario}</span>
                          <span className="block truncate text-[13px] text-sobre-variante">{s.correoUsuario}</span>
                        </span>
                        <StatusBadge {...estadoSolicitudTecnica(s.estado)} />
                      </span>
                      <span className="text-[12px] text-outline">{formatearFecha(s.fechaSolicitud)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div ref={panelRef} className="min-w-0 flex-[999_1_480px] scroll-mt-20 lg:sticky lg:top-20">
          {seleccionada ? (
            <DetalleAtencion key={seleccionada.idSolicitud} solicitud={seleccionada} idUsuarioActual={idUsuarioActual} />
          ) : (
            <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <MousePointerClick className="h-8 w-8 text-verde" aria-hidden="true" />
              <p className="font-bold">Selecciona una solicitud</p>
              <p className="max-w-sm text-sm text-sobre-variante">Aquí verás sus datos y las acciones del paso en que se encuentra.</p>
            </Card>
          )}
        </div>
      </div>
      </>
      )}
      <CrearSolicitudExternaModal
        open={creandoExterna}
        onClose={() => setCreandoExterna(false)}
        onCreada={(s) => abrirSolicitud(s.idSolicitud)}
      />
      <ProcesarCorreoModal
        open={procesandoCorreo}
        onClose={() => setProcesandoCorreo(false)}
        onAbrirSolicitud={abrirSolicitud}
      />
    </PageContainer>
  );
}
