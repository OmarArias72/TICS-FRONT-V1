"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardCopy, ExternalLink, Eye, EyeOff, Hand, Save, X } from "lucide-react";
import { toast } from "react-hot-toast";

import { Alert, Button, Card, FormField, Input, MotivoModal, StatusBadge, buttonClasses } from "@/components/ui";
import { solicitudTecnicaService } from "@/lib/api/services";
import { estadoSolicitudTecnica } from "@/lib/estados";
import { formatearFecha } from "@/lib/fechas";
import type { FormularioDetalle, SolicitudTecnica } from "@/types/api";

import { clavesMesaAyuda, URL_SERVICEDESK } from "./claves";
import { nombreTipo } from "./flujo";
import { codigoTicketSchema, type CodigoTicketValues } from "./schemas";

/** CURP con solo los primeros 4 y los últimos 2 caracteres visibles. */
function ocultarCurp(curp: string): string {
  return curp.length > 6 ? `${curp.slice(0, 4)}${"•".repeat(curp.length - 6)}${curp.slice(-2)}` : "••••";
}

/**
 * Detalle de una solicitud en el Panel Mesa de Ayuda, con las acciones del
 * paso en que se encuentra (antes SolicitudAdminModal.jsx).
 */
export function DetalleAtencion({ solicitud: s, idAdmin }: { solicitud: SolicitudTecnica; idAdmin: number }) {
  const queryClient = useQueryClient();
  const [rechazando, setRechazando] = useState(false);

  const refrescar = (mensaje: string) => {
    void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.panel });
    toast.success(mensaje);
  };
  const alFallar = (err: Error) => {
    toast.error(err.message);
    void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.panel });
  };

  const aprobar = useMutation({
    mutationFn: () => solicitudTecnicaService.aprobarSolicitud(s.idSolicitud, idAdmin),
    onSuccess: () => refrescar("Solicitud aprobada; el solicitante ya puede llenar sus datos"),
    onError: alFallar,
  });
  const rechazar = useMutation({
    mutationFn: (motivoRechazo: string) => solicitudTecnicaService.rechazarSolicitud(s.idSolicitud, idAdmin, { motivoRechazo }),
    onSuccess: () => {
      setRechazando(false);
      refrescar("Solicitud rechazada");
    },
    onError: alFallar,
  });
  const tomar = useMutation({
    mutationFn: () => solicitudTecnicaService.bloquearSolicitud(s.idSolicitud, idAdmin),
    onSuccess: () => refrescar("Tomaste la solicitud; genera el ticket en ServiceDesk"),
    onError: alFallar,
  });
  const capturar = useMutation({
    mutationFn: (codigo: string) => solicitudTecnicaService.capturarTicket(s.idSolicitud, idAdmin, { codigoTicketCreado: codigo }),
    onSuccess: () => refrescar("Ticket registrado; queda en espera de resolución"),
    onError: alFallar,
  });
  const resolver = useMutation({
    mutationFn: (codigo: string) => solicitudTecnicaService.resolverTicket(s.idSolicitud, idAdmin, { codigoTicketResuelto: codigo }),
    onSuccess: () => refrescar("Solicitud resuelta y cerrada"),
    onError: alFallar,
  });

  const enlaceServiceDesk = (
    <a href={URL_SERVICEDESK} target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary", "sm")}>
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      Ir a ServiceDesk
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  );

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold tracking-[0.06em] text-dorado-texto">
            Solicitud #{s.idSolicitud} · {nombreTipo(s.tipoNombre)}
          </p>
          <h2 className="mt-1 text-lg font-extrabold">{s.nombreUsuario}</h2>
          <p className="text-[13px] text-sobre-variante">
            {s.correoUsuario} · {formatearFecha(s.fechaSolicitud)}
          </p>
        </div>
        <StatusBadge {...estadoSolicitudTecnica(s.estado)} />
      </div>

      {s.motivo && (
        <p className="rounded-xl bg-superficie px-4 py-3 text-sm leading-relaxed text-sobre-variante">{s.motivo}</p>
      )}
      {s.revisorNombre && <p className="text-[13px] text-sobre-variante">Revisó: {s.revisorNombre}</p>}

      {s.formulario ? (
        <DatosFormulario formulario={s.formulario} />
      ) : (
        s.estado !== "PENDIENTE" &&
        s.estado !== "RECHAZADA" &&
        s.estado !== "CANCELADA" && <Alert tone="neutro">El solicitante aún no ha llenado sus datos.</Alert>
      )}

      {s.ticket?.codigoTicketCreado && (
        <dl className="grid grid-cols-1 gap-3 rounded-xl border border-variante p-4 text-sm sm:grid-cols-2">
          <Dato etiqueta="Ticket ServiceDesk">{s.ticket.codigoTicketCreado}</Dato>
          {s.ticket.capturadoPorNombre && <Dato etiqueta="Capturó">{s.ticket.capturadoPorNombre}</Dato>}
          {s.ticket.codigoTicketResuelto && <Dato etiqueta="ID de resolución">{s.ticket.codigoTicketResuelto}</Dato>}
          {s.ticket.fechaResolucionTicket && <Dato etiqueta="Resuelto">{formatearFecha(s.ticket.fechaResolucionTicket)}</Dato>}
        </dl>
      )}

      <section aria-label="Acciones" className="flex flex-col gap-3 border-t border-variante pt-5">
        {s.estado === "PENDIENTE" && (
          <div className="flex gap-2.5">
            <Button
              className="flex-1"
              loading={aprobar.isPending}
              icon={<Check className="h-4 w-4" aria-hidden="true" />}
              onClick={() => aprobar.mutate()}
            >
              Aprobar
            </Button>
            <Button
              className="flex-1"
              variant="danger-outline"
              disabled={aprobar.isPending}
              icon={<X className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setRechazando(true)}
            >
              Rechazar
            </Button>
          </div>
        )}

        {s.estado === "APROBADA" && (
          <Alert tone="info">Aprobada. Cuando el solicitante envíe sus datos podrás tomarla para generar el ticket.</Alert>
        )}

        {s.estado === "FORMULARIO_ENVIADO" && (
          <>
            <Alert tone="info">
              Al tomarla, la solicitud queda a tu nombre durante 10 minutos para que nadie más genere el mismo ticket.
            </Alert>
            <div className="flex flex-wrap gap-2.5">
              <Button loading={tomar.isPending} icon={<Hand className="h-4 w-4" aria-hidden="true" />} onClick={() => tomar.mutate()}>
                Tomar solicitud
              </Button>
              {enlaceServiceDesk}
            </div>
          </>
        )}

        {s.estado === "ESPERA_TICKET" && (
          <CodigoTicketForm
            key={`creado-${s.idSolicitud}`}
            etiqueta="ID del ticket creado en ServiceDesk"
            hint="Genera el ticket con los datos de arriba y captura aquí su número."
            boton="Guardar ID de ticket"
            enviando={capturar.isPending}
            onEnviar={(codigo) => capturar.mutate(codigo)}
            extra={enlaceServiceDesk}
          />
        )}

        {s.estado === "TICKET_CREADO" && (
          <CodigoTicketForm
            key={`resuelto-${s.idSolicitud}`}
            etiqueta="ID de resolución"
            hint="Al guardarlo, la solicitud se cierra y el solicitante verá este ID."
            boton="Marcar como resuelta"
            enviando={resolver.isPending}
            onEnviar={(codigo) => resolver.mutate(codigo)}
            extra={enlaceServiceDesk}
          />
        )}

        {(s.estado === "CERRADA" || s.estado === "RESUELTO") && <Alert tone="ok">Solicitud resuelta y cerrada.</Alert>}
        {s.estado === "RECHAZADA" && (
          <Alert tone="error" title="Rechazada.">
            {s.motivoRechazo ?? "Sin motivo registrado."} El solicitante puede reenviarla con más información.
          </Alert>
        )}
        {s.estado === "CANCELADA" && <Alert tone="neutro">El solicitante canceló esta solicitud.</Alert>}
      </section>

      <MotivoModal
        open={rechazando}
        onClose={() => setRechazando(false)}
        claveForm={s.idSolicitud}
        title="Rechazar solicitud"
        description={`#${s.idSolicitud} · ${s.nombreUsuario}`}
        hint="El solicitante verá este motivo y podrá reenviar la solicitud con más información."
        etiquetaBoton="Rechazar"
        icono={<X className="h-4 w-4" aria-hidden="true" />}
        enviando={rechazar.isPending}
        onEnviar={(motivo) => rechazar.mutate(motivo)}
      />
    </Card>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-sobre-variante">{etiqueta}</dt>
      <dd className="mt-0.5 break-words font-semibold">{children}</dd>
    </div>
  );
}

/** Datos capturados por el solicitante, con la CURP oculta hasta pedirla. */
function DatosFormulario({ formulario: f }: { formulario: FormularioDetalle }) {
  const [verCurp, setVerCurp] = useState(false);

  const copiar = async () => {
    const texto = [
      `Nombre: ${f.nombreCompleto}`,
      `Correo institucional: ${f.correoInstitucional}`,
      f.correoAlterno && `Correo alterno: ${f.correoAlterno}`,
      `Número de cuenta: ${f.numeroCuenta}`,
      f.curp && `CURP: ${f.curp}`,
      f.telefono && `Teléfono: ${f.telefono}`,
      f.descripcionProblema && `Descripción: ${f.descripcionProblema}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Datos copiados para ServiceDesk");
    } catch {
      toast.error("No se pudieron copiar los datos");
    }
  };

  return (
    <section aria-labelledby="titulo-datos-solicitante" className="flex flex-col gap-3 rounded-xl border border-variante p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="titulo-datos-solicitante" className="text-sm font-extrabold">
          Datos del solicitante
        </h3>
        <Button size="sm" variant="ghost" icon={<ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />} onClick={copiar}>
          Copiar datos
        </Button>
      </div>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <Dato etiqueta="Nombre">{f.nombreCompleto}</Dato>
        <Dato etiqueta="Número de cuenta">{f.numeroCuenta}</Dato>
        <Dato etiqueta="Correo institucional">{f.correoInstitucional}</Dato>
        {f.correoAlterno && <Dato etiqueta="Correo alterno">{f.correoAlterno}</Dato>}
        {f.telefono && <Dato etiqueta="Teléfono">{f.telefono}</Dato>}
        {f.curp && (
          <div className="min-w-0">
            <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-sobre-variante">CURP</dt>
            <dd className="mt-0.5 flex items-center gap-2 font-mono font-semibold">
              {verCurp ? f.curp : ocultarCurp(f.curp)}
              <button
                type="button"
                onClick={() => setVerCurp((v) => !v)}
                aria-label={verCurp ? "Ocultar CURP" : "Mostrar CURP"}
                className="rounded-md p-1 text-sobre-variante hover:bg-variante focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado"
              >
                {verCurp ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </dd>
          </div>
        )}
        {f.descripcionProblema && (
          <div className="sm:col-span-2">
            <Dato etiqueta="Descripción">{f.descripcionProblema}</Dato>
          </div>
        )}
      </dl>
    </section>
  );
}

function CodigoTicketForm({
  etiqueta,
  hint,
  boton,
  enviando,
  onEnviar,
  extra,
}: {
  etiqueta: string;
  hint: string;
  boton: string;
  enviando: boolean;
  onEnviar: (codigo: string) => void;
  extra?: ReactNode;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CodigoTicketValues>({ resolver: zodResolver(codigoTicketSchema), defaultValues: { codigo: "" } });

  return (
    <form noValidate onSubmit={handleSubmit((v) => onEnviar(v.codigo))} className="flex flex-col gap-3">
      <FormField label={etiqueta} required error={errors.codigo?.message} hint={hint}>
        {(a11y) => <Input {...a11y} autoComplete="off" {...register("codigo")} />}
      </FormField>
      <div className="flex flex-wrap gap-2.5">
        <Button type="submit" loading={enviando} icon={<Save className="h-4 w-4" aria-hidden="true" />}>
          {boton}
        </Button>
        {extra}
      </div>
    </form>
  );
}
