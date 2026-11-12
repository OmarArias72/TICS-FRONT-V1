"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock } from "lucide-react";

import {
  Alert,
  ButtonLink,
  Card,
  EmptyState,
  PageContainer,
  PageHeader,
  PageLoader,
  StatusBadge,
} from "@/components/ui";
import { reservaSalasService } from "@/lib/api/services";
import { cn } from "@/lib/cn";
import { estadoSolicitudReserva } from "@/lib/estados";
import { formatearDia } from "@/lib/fechas";
import { useAuthStore } from "@/store/authStore";
import type { EstadoSolicitudReserva } from "@/types/api";

import { AvisoCambiosPendientes } from "../components/CambiosPendientes";
import { clavesReservas } from "../utils/claves";

type Filtro = "TODAS" | "Pendiente" | "Aprobada" | "Rechazada";

const FILTROS: Array<{ valor: Filtro; etiqueta: string }> = [
  { valor: "TODAS", etiqueta: "Todas" },
  { valor: "Pendiente", etiqueta: "Pendientes" },
  { valor: "Aprobada", etiqueta: "Aprobadas" },
  { valor: "Rechazada", etiqueta: "Rechazadas" },
];

/**
 * Historial de solicitudes extraordinarias del usuario (antes
 * MisSolicitudesPage.jsx).
 *
 * Las reservas directas se consultan en "Mis reservas". Desde el backend v4
 * llegan el motivo de rechazo y quién atendió la solicitud.
 *
 * Arriba se resaltan las solicitudes de cambio que TIC le envió al profesor
 * (además del aviso en la campana), con un enlace directo a la reserva.
 */
export function MisSolicitudesPage() {
  const idUsuario = useAuthStore((s) => s.user?.idUsuario);
  const [filtro, setFiltro] = useState<Filtro>("TODAS");

  const query = useQuery({
    queryKey: clavesReservas.misSolicitudes(idUsuario),
    queryFn: reservaSalasService.misSolicitudes,
    enabled: idUsuario !== undefined,
  });

  const conteos = useMemo(() => {
    const c: Partial<Record<EstadoSolicitudReserva, number>> = {};
    for (const s of query.data ?? []) c[s.estado] = (c[s.estado] ?? 0) + 1;
    return c;
  }, [query.data]);

  const visibles = (query.data ?? []).filter((s) => filtro === "TODAS" || s.estado === filtro);

  return (
    <PageContainer narrow>
      <PageHeader
        eyebrow="Reserva de Salas"
        title="Mis solicitudes"
        description="Solicitudes extraordinarias que has enviado al administrador y cambios que TIC te pide en tus reservas."
        actions={
          <ButtonLink href="/reservas" variant="secondary" icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}>
            Volver a reservas
          </ButtonLink>
        }
      />

      <AvisoCambiosPendientes />

      <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const cantidad = f.valor === "TODAS" ? (query.data?.length ?? 0) : (conteos[f.valor] ?? 0);
          const activo = filtro === f.valor;
          return (
            <button
              key={f.valor}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltro(f.valor)}
              className={cn(
                "flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado",
                activo
                  ? "border-verde bg-verde text-white"
                  : "border-variante bg-white text-sobre-variante hover:border-verde/50",
              )}
            >
              {f.etiqueta}
              <span className={cn("rounded-full px-2 text-xs", activo ? "bg-white/20" : "bg-variante")}>{cantidad}</span>
            </button>
          );
        })}
      </div>

      {query.isPending ? (
        <PageLoader label="Cargando solicitudes..." />
      ) : query.isError ? (
        <Alert tone="error">{query.error.message}</Alert>
      ) : visibles.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-8 w-8" aria-hidden="true" />}
          title={filtro === "TODAS" ? "No has enviado solicitudes extraordinarias" : "No hay solicitudes con este estado"}
          description="Las solicitudes se envían desde Reserva de Salas cuando un horario no se puede reservar directamente."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visibles.map((s) => (
            <li key={s.idSolicitud}>
              <Card className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold tracking-[0.06em] text-dorado-texto">
                      Solicitud #{s.idSolicitud} · {s.codigoSala}
                    </p>
                    <p className="mt-1 text-base font-extrabold capitalize">
                      {formatearDia(s.fecha)} · {s.horaInicio} – {s.horaFin}
                    </p>
                    {s.nombreSala && <p className="text-[13px] text-sobre-variante">{s.nombreSala}</p>}
                  </div>
                  <StatusBadge {...estadoSolicitudReserva(s.estado)} />
                </div>
                {s.justificacion && (
                  <p className="rounded-xl bg-superficie px-4 py-3 text-sm leading-relaxed text-sobre-variante">
                    {s.justificacion}
                  </p>
                )}
                {s.estado === "Rechazada" && (
                  <p className="rounded-xl bg-error-claro px-4 py-3 text-[13px] text-error-oscuro">
                    <span className="font-bold">Motivo del rechazo:</span>{" "}
                    {s.motivoRechazo ?? "sin motivo registrado. Consúltalo con el área de TICS."}
                  </p>
                )}
                {s.adminAtendio && s.estado !== "Pendiente" && (
                  <p className="text-[12px] text-outline">Atendió: {s.adminAtendio}</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
