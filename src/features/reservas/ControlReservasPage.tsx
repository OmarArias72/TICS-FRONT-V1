"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightLeft, CalendarClock, CalendarCog, Check, Clock, MessageSquare, X } from "lucide-react";

import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CountBadge,
  EmptyState,
  Input,
  Label,
  PageContainer,
  PageHeader,
  Select,
  StatusBadge,
} from "@/components/ui";
import { usePermiso } from "@/features/auth/usePermiso";
import { reservaSalasService, salaService } from "@/lib/api/services";
import { estadoSolicitudReserva } from "@/lib/estados";
import { formatearDia, hoyISO } from "@/lib/fechas";
import { useAuthStore } from "@/store/authStore";
import type { SolicitudReserva, UsoSala } from "@/types/api";

import {
  AprobarSolicitudModal,
  CancelarReservaModal,
  ReasignarReservaModal,
  RechazarSolicitudModal,
  SolicitarCambioModal,
} from "./AccionesReservaModals";
import { AgendaTable } from "./AgendaTable";
import { clavesReservas } from "./claves";
import { profesorPuedeCambiar } from "./reglas";

/**
 * Control de Reservas para Admin y Operador (antes AdminReservationsPage.jsx).
 * Permiso: "reservas.gestionar". El usuario en sesión se envía como idAdmin.
 */
export function ControlReservasPage() {
  const idAdmin = useAuthStore((s) => s.user?.idUsuario);
  const puedeConfigurarAgenda = usePermiso("agenda.configurar");

  const [idSalaElegida, setIdSalaElegida] = useState<number | null>(null);
  const [fecha, setFecha] = useState(hoyISO);

  const [aprobando, setAprobando] = useState<SolicitudReserva | null>(null);
  const [rechazando, setRechazando] = useState<SolicitudReserva | null>(null);
  const [reasignando, setReasignando] = useState<UsoSala | null>(null);
  const [cancelando, setCancelando] = useState<UsoSala | null>(null);
  const [pidiendoCambio, setPidiendoCambio] = useState<UsoSala | null>(null);

  const salasQuery = useQuery({ queryKey: clavesReservas.salas, queryFn: salaService.listarTodas });
  const salas = salasQuery.data ?? [];
  const sala = salas.find((s) => s.idSala === idSalaElegida) ?? salas[0] ?? null;

  const pendientesQuery = useQuery({
    queryKey: clavesReservas.pendientes,
    queryFn: reservaSalasService.listarSolicitudesPendientes,
  });
  const pendientes = [...(pendientesQuery.data ?? [])].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio),
  );

  const agendaQuery = useQuery({
    queryKey: clavesReservas.agenda(sala?.idSala, fecha),
    queryFn: () => reservaSalasService.obtenerAgenda(sala!.idSala, fecha),
    enabled: sala !== null && Boolean(fecha),
  });
  const agenda = agendaQuery.data ?? [];
  const esPasado = fecha < hoyISO();
  // Pedir el cambio al profesor solo tiene sentido si aún puede modificarla
  // (hasta el día anterior); después, el admin reasigna directamente.
  const sePuedePedirCambio = profesorPuedeCambiar(fecha);

  if (idAdmin === undefined) return null;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Administración TIC"
        title="Control de Reservas"
        description="Atiende solicitudes extraordinarias y ajusta la agenda de cada sala."
        actions={
          puedeConfigurarAgenda && (
            <ButtonLink
              href="/admin/config-agenda"
              variant="secondary"
              icon={<CalendarCog className="h-4 w-4" aria-hidden="true" />}
            >
              Apertura / Cierre de agenda
            </ButtonLink>
          )
        }
      />

      <div className="flex flex-wrap items-start gap-6">
        <section aria-labelledby="titulo-pendientes" className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h2 id="titulo-pendientes" className="text-lg font-extrabold">
              Solicitudes pendientes
            </h2>
            {pendientes.length > 0 && <CountBadge value={pendientes.length} tono="alerta" />}
          </div>

          {pendientesQuery.isPending ? (
            <p className="text-sm text-sobre-variante">Cargando solicitudes...</p>
          ) : pendientesQuery.isError ? (
            <Alert tone="error">{pendientesQuery.error.message}</Alert>
          ) : pendientes.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="h-8 w-8" aria-hidden="true" />}
              title="No hay solicitudes pendientes"
              description="Las solicitudes extraordinarias de los profesores aparecerán aquí."
            />
          ) : (
            <ul className="flex flex-col gap-3.5">
              {pendientes.map((s) => (
                <li key={s.idSolicitud}>
                  <Card className="flex flex-col gap-3.5 p-5">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-extrabold">
                          {s.codigoSala}
                          {s.nombreSala ? ` · ${s.nombreSala}` : ""}
                        </p>
                        <p className="mt-0.5 text-sm text-sobre-variante">{s.profesor}</p>
                      </div>
                      <StatusBadge {...estadoSolicitudReserva(s.estado)} className="self-start" />
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1.5 capitalize">
                        <CalendarClock className="h-4 w-4 text-sobre-variante" aria-hidden="true" />
                        {formatearDia(s.fecha)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-sobre-variante" aria-hidden="true" />
                        {s.horaInicio} – {s.horaFin}
                      </span>
                    </div>
                    {s.justificacion && (
                      <p className="rounded-xl bg-superficie px-3.5 py-3 text-sm leading-relaxed text-sobre-variante">
                        {s.justificacion}
                      </p>
                    )}
                    <div className="flex gap-2.5">
                      <Button
                        className="flex-1"
                        icon={<Check className="h-4 w-4" aria-hidden="true" />}
                        onClick={() => setAprobando(s)}
                      >
                        Aprobar
                      </Button>
                      <Button
                        className="flex-1"
                        variant="danger-outline"
                        icon={<X className="h-4 w-4" aria-hidden="true" />}
                        onClick={() => setRechazando(s)}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Card className="min-w-0 flex-[999_1_560px] overflow-hidden">
          <section aria-labelledby="titulo-agenda-sala">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-variante px-6 py-5">
              <div>
                <h2 id="titulo-agenda-sala" className="text-lg font-extrabold">
                  Agenda por sala
                </h2>
                <p className="mt-1 text-[13px] capitalize text-sobre-variante">{formatearDia(fecha)}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sala-agenda">Sala</Label>
                  <Select
                    id="sala-agenda"
                    value={sala ? String(sala.idSala) : ""}
                    onChange={(e) => setIdSalaElegida(Number(e.target.value))}
                    disabled={salas.length === 0}
                    className="w-64"
                  >
                    {salas.map((s) => (
                      <option key={s.idSala} value={String(s.idSala)}>
                        {s.codigoSala} · {s.nombre ?? ""}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="fecha-control">Fecha</Label>
                  <Input
                    id="fecha-control"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value || hoyISO())}
                    className="w-44"
                  />
                </div>
              </div>
            </div>

            {salasQuery.isError && (
              <div className="p-4">
                <Alert tone="error">{salasQuery.error.message}</Alert>
              </div>
            )}

            <AgendaTable
              agenda={agenda}
              cargando={sala !== null && agendaQuery.isPending}
              error={agendaQuery.isError ? agendaQuery.error.message : null}
              vacio={sala ? undefined : "No hay salas registradas."}
              acciones={
                esPasado
                  ? undefined
                  : (uso) => (
                      <>
                        {sePuedePedirCambio && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />}
                            onClick={() => setPidiendoCambio(uso)}
                          >
                            Pedir cambio
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />}
                          onClick={() => setReasignando(uso)}
                        >
                          Reasignar
                        </Button>
                        <Button size="sm" variant="danger-outline" onClick={() => setCancelando(uso)}>
                          Cancelar
                        </Button>
                      </>
                    )
              }
            />
            {esPasado && (
              <p className="border-t border-variante px-6 py-4 text-[13px] text-sobre-variante">
                Fecha pasada: la agenda se muestra solo como consulta.
              </p>
            )}
          </section>
        </Card>
      </div>

      <AprobarSolicitudModal solicitud={aprobando} salas={salas} idAdmin={idAdmin} onClose={() => setAprobando(null)} />
      <RechazarSolicitudModal solicitud={rechazando} idAdmin={idAdmin} onClose={() => setRechazando(null)} />
      <ReasignarReservaModal
        uso={reasignando}
        fecha={fecha}
        salas={salas}
        idAdmin={idAdmin}
        onClose={() => setReasignando(null)}
      />
      <SolicitarCambioModal
        uso={pidiendoCambio}
        fecha={fecha}
        idAdmin={idAdmin}
        onClose={() => setPidiendoCambio(null)}
      />
      <CancelarReservaModal uso={cancelando} fecha={fecha} idAdmin={idAdmin} onClose={() => setCancelando(null)} />
    </PageContainer>
  );
}
