"use client";

import { useQuery } from "@tanstack/react-query";
import { BellRing, CalendarDays, Clock, Pencil, Reply } from "lucide-react";

import { ButtonLink } from "@/components/ui";
import { FUNCIONES_BACKEND } from "@/lib/api/funcionesBackend";
import { reservaSalasService } from "@/lib/api/services";
import { formatearDia } from "@/lib/fechas";
import { useAuthStore } from "@/store/authStore";
import type { UsoSala } from "@/types/api";

import { clavesReservas } from "../utils/claves";

/**
 * Reservas propias con una solicitud de cambio de TIC que espera algo del
 * profesor: responderla (Pendiente) o hacer el cambio ya aceptado (Aceptada),
 * mientras siga a tiempo. Usa la misma consulta (y caché) que "Mis reservas",
 * así que se actualiza junto con ella y con la campana.
 */
export function useCambiosPendientes() {
  const idUsuario = useAuthStore((s) => s.user?.idUsuario);
  const query = useQuery({
    queryKey: clavesReservas.misReservas(idUsuario),
    queryFn: reservaSalasService.misReservas,
    enabled: FUNCIONES_BACKEND.misReservas && idUsuario !== undefined,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const cambios = (query.data ?? [])
    .filter(
      (r) =>
        r.estado !== "Cancelada" &&
        r.editablePorProfesor &&
        (r.solicitudCambio?.estado === "Pendiente" || r.solicitudCambio?.estado === "Aceptada"),
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio));
  return { cambios, cargando: query.isPending };
}

/** Enlace a la reserva dentro de "Mis reservas" (la tarjeta se resalta y se desplaza a la vista). */
export const enlaceReserva = (idUso: number) => `/reservas/mis-reservas?reserva=${idUso}`;

/**
 * Bloque resaltado con las solicitudes de cambio que esperan al profesor.
 * No muestra nada si no hay ninguna.
 */
export function AvisoCambiosPendientes({ compacto = false }: { compacto?: boolean }) {
  const { cambios } = useCambiosPendientes();
  if (cambios.length === 0) return null;
  const porResponder = cambios.filter((r) => r.solicitudCambio?.estado === "Pendiente").length;

  return (
    <section
      aria-labelledby="titulo-cambios-pendientes"
      className="flex flex-col gap-3 rounded-2xl border-2 border-dorado bg-dorado-claro p-4 text-dorado-oscuro shadow-sm sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dorado text-dorado-oscuro">
          <BellRing className="h-5 w-5" aria-hidden="true" />
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-ping rounded-full bg-error motion-reduce:animate-none" aria-hidden="true" />
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-error" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="titulo-cambios-pendientes" className="text-base font-extrabold">
            {porResponder > 0
              ? `TIC te pide cambiar ${porResponder === 1 ? "una reserva" : `${porResponder} reservas`}`
              : "Tienes cambios aceptados por hacer"}
          </h2>
          <p className="text-[13px]">
            {porResponder > 0
              ? "Responde antes del día de la reserva: acepta y elige otro horario, o explica por qué no puedes."
              : "Elige la nueva sala, fecha u horario antes del día de la reserva."}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {cambios.map((r) => (
          <TarjetaCambio key={r.idUso} reserva={r} compacto={compacto} />
        ))}
      </ul>
    </section>
  );
}

function TarjetaCambio({ reserva: r, compacto }: { reserva: UsoSala; compacto: boolean }) {
  const c = r.solicitudCambio!;
  const pendiente = c.estado === "Pendiente";
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sobre-superficie">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-extrabold">
          <span>{r.codigoSala}</span>
          <span className="flex items-center gap-1 capitalize">
            <CalendarDays className="h-3.5 w-3.5 text-sobre-variante" aria-hidden="true" />
            {formatearDia(r.fecha)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-sobre-variante" aria-hidden="true" />
            {r.horaInicio} – {r.horaFin}
          </span>
          <span
            className={
              pendiente
                ? "rounded-full bg-error-claro px-2 py-0.5 text-[10px] uppercase tracking-[0.06em] text-error-oscuro"
                : "rounded-full bg-verde-claro px-2 py-0.5 text-[10px] uppercase tracking-[0.06em] text-verde-oscuro"
            }
          >
            {pendiente ? "Requiere tu respuesta" : "Aceptado: falta modificar"}
          </span>
        </p>
        {!compacto && (
          <p className="mt-1 text-[13px] text-sobre-variante">
            <span className="font-semibold">{c.admin}:</span> {c.mensaje}
          </p>
        )}
      </div>
      <ButtonLink
        href={enlaceReserva(r.idUso)}
        size="sm"
        icon={
          pendiente ? <Reply className="h-3.5 w-3.5" aria-hidden="true" /> : <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        }
      >
        {pendiente ? "Responder" : "Modificar"}
      </ButtonLink>
    </li>
  );
}
