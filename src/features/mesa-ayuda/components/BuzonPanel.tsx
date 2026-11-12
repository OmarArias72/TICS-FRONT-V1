"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CircleCheck, CircleOff, Link2, MailOpen, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  Alert,
  Button,
  Card,
  CardHeader,
  StatusBadge,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableMessage,
} from "@/components/ui";
import { esCodigo } from "@/lib/api/errors";
import { solicitudTecnicaService } from "@/lib/api/services";
import { cn } from "@/lib/cn";
import { eventoCorreo, resultadoCorreo } from "@/lib/estados";
import { formatearFechaHora } from "@/lib/fechas";
import type { CorreoBuzon, ResultadoCorreo } from "@/types/api";

import { AsociarCorreoModal } from "../modals/AsociarCorreoModal";
import { clavesMesaAyuda } from "../utils/claves";

const FILTROS: Array<{ valor: ResultadoCorreo | "TODOS"; etiqueta: string }> = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "SIN_ASOCIAR", etiqueta: "Sin asociar" },
  { valor: "REGISTRADO", etiqueta: "Registrados" },
  { valor: "SIN_TICKET", etiqueta: "Sin ticket" },
  { valor: "IGNORADO", etiqueta: "Descartados" },
  { valor: "ERROR", etiqueta: "Con error" },
];

/** Refresco de la lista y del estado del lector (el backend revisa cada 5 min). */
const INTERVALO_MS = 60_000;

/**
 * Pestaña "Buzón" del panel: correos de ServiceDesk (sdp_msdtic@uaemex.mx) que
 * el backend leyó del buzón de la UAP y qué hizo con cada uno
 * (`/solicitudes-tecnicas/admin/buzon`).
 *
 * - Registrado: se aplicó a su solicitud (ticket asociado, seguimiento o cierre).
 * - Sin asociar: trae un ID de ticket que ninguna solicitud tiene. "Asociar" lo
 *   asigna a una solicitud lista para ticket y aplica los correos pendientes;
 *   "Descartar" lo marca como ajeno (ticket de otra área).
 */
export function BuzonPanel({ onAbrirSolicitud }: { onAbrirSolicitud: (idSolicitud: number) => void }) {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<ResultadoCorreo | "TODOS">("TODOS");
  const [asociando, setAsociando] = useState<CorreoBuzon | null>(null);

  const estado = useQuery({
    queryKey: clavesMesaAyuda.estadoBuzon,
    queryFn: solicitudTecnicaService.estadoBuzon,
    refetchInterval: INTERVALO_MS,
  });
  const correos = useQuery({
    queryKey: clavesMesaAyuda.buzon(filtro),
    queryFn: () => solicitudTecnicaService.correosBuzon(filtro === "TODOS" ? undefined : filtro),
    refetchInterval: INTERVALO_MS,
  });

  const revisar = useMutation({
    mutationFn: solicitudTecnicaService.revisarBuzon,
    onSuccess: ({ procesados }) => {
      toast.success(procesados === 0 ? "No hay correos nuevos" : `${procesados} correo(s) procesado(s)`);
      void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.buzon() });
      void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.panel });
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 6000 });
      if (esCodigo(err, "BUZON_ERROR")) void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.estadoBuzon });
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.estadoBuzon }),
  });

  const descartar = useMutation({
    mutationFn: (idCorreo: number) => solicitudTecnicaService.descartarCorreo(idCorreo),
    onSuccess: () => {
      toast.success("Correo descartado");
      void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.buzon() });
      void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.estadoBuzon });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const e = estado.data;
  const lista = correos.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        {estado.isPending ? (
          <p className="text-sm text-sobre-variante">Consultando el lector del buzón...</p>
        ) : estado.isError ? (
          <Alert tone="error">{estado.error.message}</Alert>
        ) : e ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              {e.habilitado ? (
                <CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-verde" aria-hidden="true" />
              ) : (
                <CircleOff className="mt-0.5 h-6 w-6 shrink-0 text-outline" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <p className="font-extrabold">
                  Lectura automática {e.habilitado ? "activa" : "deshabilitada"}
                </p>
                {e.habilitado ? (
                  <p className="text-sm text-sobre-variante">
                    {e.usuario || "(sin cuenta)"} · {e.carpeta} · cada {e.intervaloMinutos} min
                  </p>
                ) : (
                  <p className="text-sm text-sobre-variante">
                    El backend no está leyendo el buzón (IMAP_ENABLED=false). Puedes registrar correos con “Procesar
                    correo”.
                  </p>
                )}
                {e.habilitado && (
                  <p className="mt-1 text-[13px] text-sobre-variante">
                    Última revisión: {formatearFechaHora(e.ultimaRevision)}
                    {e.ultimaRevisionExitosa && ` · última exitosa: ${formatearFechaHora(e.ultimaRevisionExitosa)}`}
                    {` · ${e.correosUltimaRevision} correo(s) en la última`}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="secondary"
              disabled={!e.habilitado || revisar.isPending}
              icon={<RefreshCw className={cn("h-4 w-4", revisar.isPending && "animate-spin")} aria-hidden="true" />}
              onClick={() => revisar.mutate()}
            >
              {revisar.isPending ? "Revisando..." : "Revisar ahora"}
            </Button>
            {e.pendientesDeAsociar > 0 && (
              <Alert
                tone="alerta"
                title={`${e.pendientesDeAsociar} correo(s) con ticket sin asociar.`}
                className="w-full"
                action={
                  filtro !== "SIN_ASOCIAR" && (
                    <Button size="sm" variant="secondary" onClick={() => setFiltro("SIN_ASOCIAR")}>
                      Ver
                    </Button>
                  )
                }
              >
                Asócialos a su solicitud o descártalos si son tickets de otra área.
              </Alert>
            )}
            {e.ultimoError && (
              <Alert tone="error" title="La última revisión falló." className="w-full">
                <span className="break-words">{e.ultimoError}</span>
              </Alert>
            )}
          </div>
        ) : null}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="Correos leídos"
          description="Los 100 más recientes. Los registrados ya aparecen en el seguimiento del ticket de cada solicitud."
          actions={
            <div role="group" aria-label="Filtrar por resultado" className="flex flex-wrap gap-2">
              {FILTROS.map((f) => {
                const activo = filtro === f.valor;
                return (
                  <button
                    key={f.valor}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setFiltro(f.valor)}
                    className={cn(
                      "h-9 rounded-full border px-3.5 text-[13px] font-bold transition-colors",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado",
                      activo ? "border-verde bg-verde text-white" : "border-variante bg-white text-sobre-variante hover:border-verde/50",
                    )}
                  >
                    {f.etiqueta}
                  </button>
                );
              })}
            </div>
          }
        />
        <Table minWidth={860}>
          <THead>
            <tr>
              <TH>Recibido</TH>
              <TH>Correo</TH>
              <TH>Resultado</TH>
              <TH>Detalle</TH>
              <TH className="text-right">Acciones</TH>
            </tr>
          </THead>
          <tbody>
            {correos.isPending ? (
              <TableMessage colSpan={5} loading>
                Cargando correos...
              </TableMessage>
            ) : correos.isError ? (
              <TableMessage colSpan={5} tone="error">
                {correos.error.message}
              </TableMessage>
            ) : lista.length === 0 ? (
              <TableMessage colSpan={5}>
                <MailOpen className="h-4 w-4" aria-hidden="true" />
                No hay correos con este resultado.
              </TableMessage>
            ) : (
              lista.map((c) => (
                <TR key={c.idCorreo}>
                  <TD className="whitespace-nowrap text-[13px]">
                    {formatearFechaHora(c.fechaCorreo ?? c.fechaProceso)}
                  </TD>
                  <TD className="max-w-sm">
                    {c.evento && <StatusBadge {...eventoCorreo(c.evento)} className="mb-1" />}
                    <span className="block font-semibold">{c.asunto || "(sin asunto)"}</span>
                    {c.tituloTicket && <span className="block text-[13px] text-sobre-variante">{c.tituloTicket}</span>}
                    <span className="block truncate text-[12px] text-outline">{c.remitente ?? "—"}</span>
                  </TD>
                  <TD>
                    <StatusBadge {...resultadoCorreo(c.resultado)} />
                    {c.codigoTicket && <span className="mt-1 block text-[12px] text-outline">{c.codigoTicket}</span>}
                  </TD>
                  <TD className="max-w-xs text-[13px] text-sobre-variante">{c.detalle ?? "—"}</TD>
                  <TD>
                    <div className="flex flex-wrap justify-end gap-2">
                      {c.idSolicitud ? (
                        <Button size="sm" variant="ghost" onClick={() => onAbrirSolicitud(c.idSolicitud!)}>
                          Ver #{c.idSolicitud}
                        </Button>
                      ) : null}
                      {c.resultado === "SIN_ASOCIAR" && (
                        <Button size="sm" icon={<Link2 className="h-3.5 w-3.5" aria-hidden="true" />} onClick={() => setAsociando(c)}>
                          Asociar
                        </Button>
                      )}
                      {(c.resultado === "SIN_ASOCIAR" || c.resultado === "SIN_TICKET") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={descartar.isPending && descartar.variables === c.idCorreo}
                          icon={<Ban className="h-3.5 w-3.5" aria-hidden="true" />}
                          onClick={() => descartar.mutate(c.idCorreo)}
                        >
                          Descartar
                        </Button>
                      )}
                      {!c.idSolicitud && c.resultado !== "SIN_ASOCIAR" && c.resultado !== "SIN_TICKET" && (
                        <span className="text-outline">—</span>
                      )}
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <AsociarCorreoModal correo={asociando} onClose={() => setAsociando(null)} onAsociado={onAbrirSolicitud} />
    </div>
  );
}
