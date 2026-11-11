"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";

import { Alert, Card, CardHeader, CountBadge, Label, Select, StatusBadge, TD, TH, THead, TR, Table, TableMessage } from "@/components/ui";
import { FUNCIONES_BACKEND } from "@/lib/api/funcionesBackend";
import { reservaSalasService } from "@/lib/api/services";
import { estadoSolicitudCambio } from "@/lib/estados";
import { formatearDia, formatearFechaHora } from "@/lib/fechas";
import type { EstadoSolicitudCambio } from "@/types/api";

import { clavesReservas } from "./claves";

const FILTROS: Array<{ valor: EstadoSolicitudCambio | "TODAS"; etiqueta: string }> = [
  { valor: "Pendiente", etiqueta: "Pendientes de respuesta" },
  { valor: "Aceptada", etiqueta: "Aceptadas (por aplicar)" },
  { valor: "Rechazada", etiqueta: "Rechazadas" },
  { valor: "Aplicada", etiqueta: "Aplicadas" },
  { valor: "Expirada", etiqueta: "Expiradas" },
  { valor: "TODAS", etiqueta: "Todas (últimas 200)" },
];

/**
 * Seguimiento de las solicitudes de cambio que el Admin/Operador envió a los
 * profesores (`GET /reservas-salas/admin/solicitudes-cambio?estado=`).
 * Una "Rechazada" trae el motivo del profesor: el admin decide si reasigna.
 */
export function SolicitudesCambioPanel() {
  const [filtro, setFiltro] = useState<EstadoSolicitudCambio | "TODAS">("Pendiente");
  const disponible = FUNCIONES_BACKEND.solicitudesCambio;

  const query = useQuery({
    queryKey: clavesReservas.solicitudesCambio(filtro),
    queryFn: () => reservaSalasService.solicitudesCambio(filtro === "TODAS" ? undefined : filtro),
    enabled: disponible,
  });
  const solicitudes = query.data ?? [];

  if (!disponible) return null;

  return (
    <Card className="overflow-hidden">
      <section aria-labelledby="titulo-cambios">
        <CardHeader
          titleId="titulo-cambios"
          title={
            <span className="flex items-center gap-2">
              Solicitudes de cambio a profesores
              {filtro === "Pendiente" && solicitudes.length > 0 && <CountBadge value={solicitudes.length} tono="alerta" />}
            </span>
          }
          description="Cambios de sala o fecha que pediste con “Pedir cambio”. El profesor responde desde Mis reservas."
          actions={
            <div className="flex flex-col gap-1">
              <Label htmlFor="filtro-cambios">Mostrar</Label>
              <Select
                id="filtro-cambios"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value as EstadoSolicitudCambio | "TODAS")}
                className="w-60"
              >
                {FILTROS.map((f) => (
                  <option key={f.valor} value={f.valor}>
                    {f.etiqueta}
                  </option>
                ))}
              </Select>
            </div>
          }
        />
        {query.isError ? (
          <div className="p-4">
            <Alert tone="error">{query.error.message}</Alert>
          </div>
        ) : (
          <Table minWidth={900}>
            <THead>
              <tr>
                <TH>Reserva</TH>
                <TH>Profesor</TH>
                <TH>Mensaje de TICS</TH>
                <TH>Estado</TH>
                <TH>Respuesta del profesor</TH>
                <TH>Pidió</TH>
              </tr>
            </THead>
            <tbody>
              {query.isPending ? (
                <TableMessage colSpan={6} loading>
                  Cargando solicitudes de cambio...
                </TableMessage>
              ) : solicitudes.length === 0 ? (
                <TableMessage colSpan={6}>
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  No hay solicitudes de cambio con este estado.
                </TableMessage>
              ) : (
                solicitudes.map((c) => (
                  <TR key={c.idSolicitudCambio}>
                    <TD className="whitespace-nowrap">
                      <span className="block font-extrabold">{c.codigoSala}</span>
                      <span className="block text-[13px] capitalize text-sobre-variante">
                        {formatearDia(c.fecha)} · {c.horaInicio}–{c.horaFin}
                      </span>
                    </TD>
                    <TD>{c.profesor}</TD>
                    <TD className="max-w-xs text-sobre-variante">{c.mensaje}</TD>
                    <TD>
                      <StatusBadge {...estadoSolicitudCambio(c.estado)} />
                    </TD>
                    <TD className="max-w-xs text-sobre-variante">
                      {c.respuesta ?? "—"}
                      {c.fechaRespuesta && (
                        <span className="mt-0.5 block text-[12px] text-outline">{formatearFechaHora(c.fechaRespuesta)}</span>
                      )}
                    </TD>
                    <TD className="whitespace-nowrap">
                      <span className="block">{c.admin}</span>
                      <span className="block text-[12px] text-outline">{formatearFechaHora(c.fechaCreacion)}</span>
                    </TD>
                  </TR>
                ))
              )}
            </tbody>
          </Table>
        )}
      </section>
    </Card>
  );
}
