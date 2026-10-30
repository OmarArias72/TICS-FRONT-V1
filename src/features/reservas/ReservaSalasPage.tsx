"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Plus } from "lucide-react";

import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Label,
  PageContainer,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { reservaSalasService, salaService } from "@/lib/api/services";
import { cn } from "@/lib/cn";
import { estadoSolicitudReserva } from "@/lib/estados";
import { formatearDia, hoyISO } from "@/lib/fechas";
import { useAuthStore } from "@/store/authStore";
import type { Sala } from "@/types/api";

import { AgendaTable } from "./AgendaTable";
import { clavesReservas } from "./claves";
import { MAX_DIAS_ANTICIPACION } from "./reglas";
import { ReservaModal } from "./ReservaModal";

/**
 * Reserva de Salas para Profesor (y Admin, de forma opcional), antes
 * ReservaSalasPage.jsx. Permiso: "reservas.reservar".
 */
export function ReservaSalasPage() {
  const idUsuario = useAuthStore((s) => s.user?.idUsuario);
  const [idSalaElegida, setIdSalaElegida] = useState<number | null>(null);
  const [fecha, setFecha] = useState(hoyISO);
  const [modalAbierto, setModalAbierto] = useState(false);

  const salasQuery = useQuery({ queryKey: clavesReservas.salas, queryFn: salaService.listarTodas });
  const salas = salasQuery.data ?? [];
  // Sin elección explícita se muestra la primera sala (sin efectos para sincronizar).
  const sala: Sala | null = salas.find((s) => s.idSala === idSalaElegida) ?? salas[0] ?? null;

  const agendaQuery = useQuery({
    queryKey: clavesReservas.agenda(sala?.idSala, fecha),
    queryFn: () => reservaSalasService.obtenerAgenda(sala!.idSala, fecha),
    enabled: sala !== null && Boolean(fecha),
  });

  const misSolicitudesQuery = useQuery({
    queryKey: clavesReservas.misSolicitudes(idUsuario),
    queryFn: () => reservaSalasService.misSolicitudes(idUsuario!),
    enabled: idUsuario !== undefined,
  });
  const recientes = (misSolicitudesQuery.data ?? []).slice(0, 3);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Infraestructura"
        title="Reserva de Salas"
        description="Elige una sala, revisa su agenda y reserva un horario libre."
        actions={
          <>
            <ButtonLink
              href="/reservas/mis-reservas"
              variant="secondary"
              icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            >
              Mis reservas
            </ButtonLink>
            <ButtonLink
              href="/reservas/mis-solicitudes"
              variant="secondary"
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Mis solicitudes
            </ButtonLink>
          </>
        }
      />

      <div className="flex flex-wrap items-start gap-6">
        <section aria-labelledby="titulo-salas" className="flex min-w-0 flex-[1_1_280px] flex-col gap-3">
          <h2 id="titulo-salas" className="text-lg font-extrabold">
            Salas disponibles
          </h2>
          {salasQuery.isPending ? (
            <p className="text-sm text-sobre-variante">Cargando salas...</p>
          ) : salasQuery.isError ? (
            <Alert tone="error">{salasQuery.error.message}</Alert>
          ) : salas.length === 0 ? (
            <EmptyState title="No hay salas registradas" />
          ) : (
            salas.map((s) => {
              const activa = s.idSala === sala?.idSala;
              return (
                <button
                  key={s.idSala}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => setIdSalaElegida(s.idSala)}
                  className={cn(
                    "flex flex-col gap-1 rounded-2xl px-4 py-3.5 text-left transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado focus-visible:ring-offset-2",
                    activa
                      ? "border-2 border-verde bg-verde text-white"
                      : "border border-variante bg-white text-sobre-superficie hover:border-verde/50",
                  )}
                >
                  <span className={cn("text-xs font-extrabold tracking-[0.06em]", activa ? "text-dorado" : "text-dorado-texto")}>
                    {s.codigoSala}
                  </span>
                  <span className="text-base font-extrabold">{s.nombre ?? s.codigoSala}</span>
                  {s.ubicacion && (
                    <span className={cn("text-[13px]", activa ? "text-verde-claro" : "text-sobre-variante")}>
                      {s.ubicacion}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </section>

        <section aria-labelledby="titulo-agenda" className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <Card className="overflow-hidden">
            <CardHeader
              titleId="titulo-agenda"
              title={sala ? `Agenda · ${sala.nombre ?? sala.codigoSala}` : "Agenda"}
              description={fecha ? formatearDia(fecha) : undefined}
              actions={
                <>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="fecha-agenda">Fecha</Label>
                    <Input
                      id="fecha-agenda"
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value || hoyISO())}
                      className="w-44"
                    />
                  </div>
                  <Button
                    disabled={!sala}
                    icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => setModalAbierto(true)}
                  >
                    Nueva reserva
                  </Button>
                </>
              }
            />
            <AgendaTable
              agenda={agendaQuery.data ?? []}
              cargando={sala !== null && agendaQuery.isPending}
              error={agendaQuery.isError ? agendaQuery.error.message : null}
              vacio={sala ? undefined : "Selecciona una sala para ver su agenda."}
            />
            <div className="border-t border-variante p-4">
              <Alert tone="info">
                Reserva directamente cualquier horario libre desde hoy y hasta {MAX_DIAS_ANTICIPACION} días
                adelante. Si el horario está ocupado o es posterior, podrás enviar una solicitud
                extraordinaria al administrador.
              </Alert>
            </div>
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold">Mis solicitudes recientes</h2>
              <Link href="/reservas/mis-solicitudes" className="text-sm font-bold text-verde hover:text-dorado-texto">
                Ver todas
              </Link>
            </div>
            {misSolicitudesQuery.isPending ? (
              <p className="text-sm text-sobre-variante">Cargando...</p>
            ) : recientes.length === 0 ? (
              <p className="text-sm text-sobre-variante">Aún no has enviado solicitudes extraordinarias.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {recientes.map((s) => (
                  <li
                    key={s.idSolicitud}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-superficie px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-extrabold">
                        {s.codigoSala} · {formatearDia(s.fecha)} · {s.horaInicio} – {s.horaFin}
                      </p>
                      {s.justificacion && <p className="truncate text-[13px] text-sobre-variante">{s.justificacion}</p>}
                    </div>
                    <StatusBadge {...estadoSolicitudReserva(s.estado)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>

      <ReservaModal open={modalAbierto} onClose={() => setModalAbierto(false)} sala={sala} fechaInicial={fecha} />
    </PageContainer>
  );
}
