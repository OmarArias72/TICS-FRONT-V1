"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ClipboardCopy,
  ExternalLink,
  Eye,
  Hand,
  LockOpen,
  MailPlus,
  MessageSquarePlus,
  Save,
  UserRoundCheck,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";

import {
  Alert,
  Button,
  Card,
  FormField,
  Input,
  Modal,
  MotivoModal,
  StatusBadge,
  Textarea,
  buttonClasses,
} from "@/components/ui";
import { esCodigo } from "@/lib/api/errors";
import { solicitudTecnicaService } from "@/lib/api/services";
import { estadoSolicitudTecnica } from "@/lib/estados";
import { formatearFecha } from "@/lib/fechas";
import type { FormularioDetalle, SolicitudTecnica } from "@/types/api";

import { ActualizacionesTicket } from "./ActualizacionesTicket";
import { clavesMesaAyuda, URL_SERVICEDESK } from "./claves";
import { HORAS_ENLACE_EXTERNO, nombreTipo } from "./flujo";
import { EtiquetaExterna } from "./EtiquetaExterna";
import { HistorialSolicitud } from "./HistorialSolicitud";
import {
  codigoTicketSchema,
  reenviarEnlaceSchema,
  type CodigoTicketValues,
  type ReenviarEnlaceValues,
} from "./schemas";

const resolverSchema = codigoTicketSchema.extend({
  comentario: z.string().trim().max(2000, "Máximo 2000 caracteres"),
});
type ResolverValues = z.infer<typeof resolverSchema>;

function hora(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

interface DetalleAtencionProps {
  /** La fila del panel; el detalle completo se pide aparte. */
  solicitud: SolicitudTecnica;
  idUsuarioActual: number;
}

/**
 * Detalle de una solicitud en el Panel Mesa de Ayuda, con las acciones del
 * paso en que se encuentra (antes SolicitudAdminModal.jsx).
 *
 * Backend v4: muestra quién la está atendiendo y hasta cuándo, permite
 * liberarla, registrar seguimiento del ticket y ver la CURP completa (la
 * consulta queda en la auditoría).
 */
export function DetalleAtencion({ solicitud: fila, idUsuarioActual }: DetalleAtencionProps) {
  const queryClient = useQueryClient();
  const [rechazando, setRechazando] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [reenviandoEnlace, setReenviandoEnlace] = useState(false);
  // Hora de referencia para el bloqueo; el componente se vuelve a montar al
  // cambiar de solicitud y el panel se refresca cada 30 s.
  const [ahora] = useState(() => Date.now());

  // El listado no trae historial; el detalle sí (y las actualizaciones del ticket).
  const detalleQuery = useQuery({
    queryKey: [...clavesMesaAyuda.panel, "detalle", fila.idSolicitud, fila.estado],
    queryFn: () => solicitudTecnicaService.detalleAdmin(fila.idSolicitud),
  });
  const s = detalleQuery.data ?? fila;

  const refrescar = () => void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.panel });
  const alTerminar = (mensaje: string) => {
    refrescar();
    toast.success(mensaje);
  };
  const alFallar = (err: Error) => {
    toast.error(err.message);
    if (esCodigo(err, "EN_ATENCION", "REGLA_NEGOCIO", "NO_ENCONTRADO")) refrescar();
  };

  const aprobar = useMutation({
    mutationFn: () => solicitudTecnicaService.aprobarSolicitud(s.idSolicitud),
    onSuccess: () => alTerminar("Solicitud aprobada; el solicitante ya puede llenar sus datos"),
    onError: alFallar,
  });
  const rechazar = useMutation({
    mutationFn: (motivo: string) =>
      s.externa
        ? solicitudTecnicaService.rechazarExterna(s.idSolicitud, motivo)
        : solicitudTecnicaService.rechazarSolicitud(s.idSolicitud, motivo),
    onSuccess: () => {
      setRechazando(false);
      alTerminar(s.externa ? "Solicitud rechazada; se avisó a la persona por correo" : "Solicitud rechazada");
    },
    onError: alFallar,
  });
  const reenviarEnlace = useMutation({
    mutationFn: (correo: string) => solicitudTecnicaService.reenviarEnlace(s.idSolicitud, correo),
    onSuccess: (r) => {
      setReenviandoEnlace(false);
      alTerminar(`Enlace nuevo enviado a ${r.correoUsuario}; el anterior ya no sirve`);
    },
    onError: alFallar,
  });
  const tomar = useMutation({
    mutationFn: () => solicitudTecnicaService.bloquearSolicitud(s.idSolicitud),
    onSuccess: () => alTerminar("Tomaste la solicitud; genera el ticket en ServiceDesk"),
    onError: alFallar,
  });
  const liberar = useMutation({
    mutationFn: () => solicitudTecnicaService.liberarSolicitud(s.idSolicitud),
    onSuccess: () => alTerminar("Liberaste la solicitud; otra persona puede atenderla"),
    onError: alFallar,
  });
  const capturar = useMutation({
    mutationFn: (codigo: string) => solicitudTecnicaService.capturarTicket(s.idSolicitud, codigo),
    onSuccess: () => alTerminar("Ticket registrado; queda en espera de resolución"),
    onError: alFallar,
  });
  const actualizar = useMutation({
    mutationFn: (descripcion: string) => solicitudTecnicaService.agregarActualizacion(s.idSolicitud, descripcion),
    onSuccess: () => {
      setAgregando(false);
      alTerminar(
        s.externa
          ? "Seguimiento registrado en el historial"
          : "Seguimiento registrado; el solicitante recibirá un aviso",
      );
    },
    onError: alFallar,
  });
  const resolver = useMutation({
    mutationFn: (v: ResolverValues) => solicitudTecnicaService.resolverTicket(s.idSolicitud, v.codigo, v.comentario),
    onSuccess: () => alTerminar("Solicitud resuelta y cerrada"),
    onError: alFallar,
  });

  // Bloqueo de 10 min al tomarla: si lo tiene otra persona, no se muestran sus acciones.
  const bloqueoVigente = s.bloqueoHasta !== null && new Date(s.bloqueoHasta).getTime() > ahora;
  const tomadaPorMi = s.idOperadorAtendiendo === idUsuarioActual;
  const tomadaPorOtro = s.idOperadorAtendiendo !== null && !tomadaPorMi && bloqueoVigente;

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
          <p className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold tracking-[0.06em] text-dorado-texto">
            Solicitud #{s.idSolicitud} · {nombreTipo(s.tipoNombre)}
            {s.externa && <EtiquetaExterna />}
          </p>
          <h2 className="mt-1 text-lg font-extrabold">{s.nombreUsuario}</h2>
          <p className="text-[13px] text-sobre-variante">
            {s.externa ? "Correo alterno: " : ""}
            {s.correoUsuario} · {formatearFecha(s.fechaSolicitud)}
          </p>
        </div>
        <StatusBadge {...estadoSolicitudTecnica(s.estado)} />
      </div>

      {s.externa && (
        <Alert tone="info" title="Solicitud externa.">
          {s.creadoPorNombre ? `La abrió ${s.creadoPorNombre} ` : "La abrió TIC "}
          para alguien sin acceso a su correo institucional. La persona no tiene cuenta: llena sus datos con el enlace
          que le llegó al correo alterno, no ve el seguimiento y solo recibe un correo cuando la solicitud se resuelve o se
          rechaza.
        </Alert>
      )}

      {s.atendidoPor && (s.estado === "ESPERA_TICKET" || s.estado === "FORMULARIO_ENVIADO") && (
        <p className="flex items-center gap-2 rounded-xl bg-info-claro px-4 py-2.5 text-sm text-info-oscuro">
          <UserRoundCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          {tomadaPorMi ? "La estás atendiendo tú" : `La atiende ${s.atendidoPor}`}
          {bloqueoVigente && s.bloqueoHasta ? ` hasta las ${hora(s.bloqueoHasta)}` : " (el bloqueo ya venció)"}.
        </p>
      )}

      {s.motivo && (
        <p className="rounded-xl bg-superficie px-4 py-3 text-sm leading-relaxed text-sobre-variante">{s.motivo}</p>
      )}
      {s.revisorNombre && <p className="text-[13px] text-sobre-variante">Revisó: {s.revisorNombre}</p>}

      {s.formulario ? (
        <DatosFormulario idSolicitud={s.idSolicitud} formulario={s.formulario} />
      ) : (
        s.estado !== "PENDIENTE" &&
        s.estado !== "RECHAZADA" &&
        s.estado !== "CANCELADA" && <Alert tone="neutro">El solicitante aún no ha llenado sus datos.</Alert>
      )}

      {s.ticket?.codigoTicketCreado && (
        <dl className="grid grid-cols-1 gap-3 rounded-xl border border-variante p-4 text-sm sm:grid-cols-2">
          <Dato etiqueta="Ticket de la plataforma">{s.ticket.codigoTicketCreado}</Dato>
          {s.ticket.capturadoPorNombre ? (
            <Dato etiqueta="Capturó">{s.ticket.capturadoPorNombre}</Dato>
          ) : (
            s.ticket.asociadoPorCorreo && <Dato etiqueta="Capturó">Automático (correo de ServiceDesk)</Dato>
          )}
          {s.ticket.tituloTicket && (
            <div className="min-w-0 sm:col-span-2">
              <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-sobre-variante">Título en ServiceDesk</dt>
              <dd className="mt-0.5 break-words font-semibold">{s.ticket.tituloTicket}</dd>
            </div>
          )}
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

        {s.estado === "APROBADA" && !s.externa && (
          <Alert tone="info">Aprobada. Cuando el solicitante envíe sus datos podrás tomarla para generar el ticket.</Alert>
        )}

        {s.estado === "APROBADA" && s.externa && (
          <>
            <Alert tone="alerta" title="Esperando sus datos.">
              {s.enlaceExpira
                ? `El enlace vence el ${formatearFecha(s.enlaceExpira)}; si no llena el formulario para entonces, la solicitud se rechaza sola.`
                : "Si no llena el formulario a tiempo, la solicitud se rechaza sola."}
              {s.enlaceEnviado ? ` Último envío: ${formatearFecha(s.enlaceEnviado)}.` : ""}
            </Alert>
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                icon={<MailPlus className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={() => setReenviandoEnlace(true)}
              >
                Reenviar enlace
              </Button>
              <Button
                variant="danger-outline"
                size="sm"
                icon={<X className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={() => setRechazando(true)}
              >
                Rechazar
              </Button>
            </div>
          </>
        )}

        {s.estado === "FORMULARIO_ENVIADO" &&
          (tomadaPorOtro ? (
            <Alert tone="neutro">Otra persona la está atendiendo. Podrás tomarla si la libera o cuando venza el bloqueo.</Alert>
          ) : (
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
          ))}

        {s.estado === "ESPERA_TICKET" &&
          (tomadaPorOtro ? (
            <Alert tone="neutro">{s.atendidoPor ?? "Otra persona"} está generando el ticket de esta solicitud.</Alert>
          ) : (
            <>
              <CodigoTicketForm
                key={`creado-${s.idSolicitud}`}
                etiqueta="ID del ticket creado en la plataforma"
                hint="Genera el ticket con los datos de arriba y captura aquí su número. Si llega antes el correo de creación de ServiceDesk, el ticket puede asociarse solo."
                boton="Guardar ID de ticket"
                enviando={capturar.isPending}
                onEnviar={(codigo) => capturar.mutate(codigo)}
                extra={enlaceServiceDesk}
              />
              {tomadaPorMi && (
                <div>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={liberar.isPending}
                    icon={<LockOpen className="h-3.5 w-3.5" aria-hidden="true" />}
                    onClick={() => liberar.mutate()}
                  >
                    Liberar solicitud
                  </Button>
                </div>
              )}
            </>
          ))}

        {s.externa && (s.estado === "FORMULARIO_ENVIADO" || s.estado === "ESPERA_TICKET") && !tomadaPorOtro && (
          <div>
            <Button
              size="sm"
              variant="ghost"
              icon={<X className="h-3.5 w-3.5" aria-hidden="true" />}
              onClick={() => setRechazando(true)}
            >
              Rechazar (datos incorrectos o falsos)
            </Button>
          </div>
        )}

        {s.estado === "TICKET_CREADO" && (
          <>
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                icon={<MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={() => setAgregando(true)}
              >
                Agregar seguimiento
              </Button>
              {enlaceServiceDesk}
            </div>
            <ResolverForm key={`resuelto-${s.idSolicitud}`} enviando={resolver.isPending} onEnviar={(v) => resolver.mutate(v)} />
          </>
        )}

        {(s.estado === "CERRADA" || s.estado === "RESUELTO") && <Alert tone="ok">Solicitud resuelta y cerrada.</Alert>}
        {s.estado === "RECHAZADA" && !s.externa && (
          <Alert tone="error" title="Rechazada.">
            {s.motivoRechazo ?? "Sin motivo registrado."} El solicitante puede reenviarla con más información.
          </Alert>
        )}
        {s.estado === "RECHAZADA" && s.externa && (
          <>
            <Alert tone="error" title="Rechazada.">
              {s.motivoRechazo ?? "Sin motivo registrado."} Se le avisó por correo. Si aún necesita ayuda, envíale un
              enlace nuevo: la solicitud se reabre.
            </Alert>
            <div>
              <Button
                variant="secondary"
                size="sm"
                icon={<MailPlus className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={() => setReenviandoEnlace(true)}
              >
                Reabrir y enviar enlace nuevo
              </Button>
            </div>
          </>
        )}
        {s.estado === "CANCELADA" && <Alert tone="neutro">El solicitante canceló esta solicitud.</Alert>}
      </section>

      {s.ticket?.actualizaciones && s.ticket.actualizaciones.length > 0 && (
        <ActualizacionesTicket actualizaciones={s.ticket.actualizaciones} />
      )}
      {s.historial && s.historial.length > 0 && <HistorialSolicitud historial={s.historial} />}

      <MotivoModal
        open={rechazando}
        onClose={() => setRechazando(false)}
        claveForm={s.idSolicitud}
        title="Rechazar solicitud"
        description={`#${s.idSolicitud} · ${s.nombreUsuario}`}
        hint={
          s.externa
            ? "Se enviará este motivo a su correo alterno. Podrás reabrirla enviándole un enlace nuevo."
            : "El solicitante verá este motivo y podrá reenviar la solicitud con más información."
        }
        etiquetaBoton="Rechazar"
        icono={<X className="h-4 w-4" aria-hidden="true" />}
        enviando={rechazar.isPending}
        onEnviar={(motivo) => rechazar.mutate(motivo)}
      />
      <MotivoModal
        open={agregando}
        onClose={() => setAgregando(false)}
        claveForm={`seguimiento-${s.idSolicitud}`}
        title="Agregar seguimiento"
        description={`Ticket ${s.ticket?.codigoTicketCreado ?? ""} · ${s.nombreUsuario}`}
        etiquetaCampo="Actualización"
        hint={
          s.externa
            ? "Queda en el historial. La persona no la verá: solo recibe el aviso final por correo."
            : "El solicitante la verá en su solicitud y recibirá un aviso."
        }
        etiquetaBoton="Registrar"
        varianteBoton="primary"
        icono={<Save className="h-4 w-4" aria-hidden="true" />}
        enviando={actualizar.isPending}
        onEnviar={(texto) => actualizar.mutate(texto)}
      />
      {s.externa && (
        <ReenviarEnlaceModal
          open={reenviandoEnlace}
          onClose={() => setReenviandoEnlace(false)}
          solicitud={s}
          enviando={reenviarEnlace.isPending}
          onEnviar={(correo) => reenviarEnlace.mutate(correo)}
        />
      )}
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

/**
 * Datos capturados por el solicitante. La CURP llega enmascarada; la completa
 * se pide al backend al pulsar "Mostrar" (queda en la auditoría).
 */
function DatosFormulario({
  idSolicitud,
  formulario: f,
}: {
  idSolicitud: number;
  formulario: FormularioDetalle;
}) {
  const curp = useMutation({
    mutationFn: () => solicitudTecnicaService.obtenerCurp(idSolicitud),
    onError: (err: Error) => toast.error(err.message),
  });
  const curpCompleta = curp.data?.curp ?? null;

  const copiar = async () => {
    const texto = [
      `Nombre: ${f.nombreCompleto}`,
      `Correo institucional: ${f.correoInstitucional}`,
      f.correoAlterno && `Correo alterno: ${f.correoAlterno}`,
      `Número de cuenta: ${f.numeroCuenta}`,
      `CURP: ${curpCompleta ?? f.curpEnmascarada ?? ""}`,
      f.telefono && `Teléfono: ${f.telefono}`,
      f.descripcionProblema && `Descripción: ${f.descripcionProblema}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(curpCompleta ? "Datos copiados para la plataforma" : "Datos copiados (la CURP va enmascarada)");
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
        <div className="min-w-0">
          <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-sobre-variante">CURP</dt>
          <dd className="mt-0.5 flex flex-wrap items-center gap-2 font-mono font-semibold">
            {curpCompleta ?? f.curpEnmascarada ?? "—"}
            {!curpCompleta && f.curpEnmascarada && (
              <Button
                size="sm"
                variant="ghost"
                loading={curp.isPending}
                icon={<Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={() => curp.mutate()}
              >
                Mostrar
              </Button>
            )}
          </dd>
          {curpCompleta && <p className="mt-0.5 text-[11px] text-outline">La consulta quedó registrada en la auditoría.</p>}
        </div>
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

function ResolverForm({ enviando, onEnviar }: { enviando: boolean; onEnviar: (v: ResolverValues) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResolverValues>({ resolver: zodResolver(resolverSchema), defaultValues: { codigo: "", comentario: "" } });

  return (
    <form noValidate onSubmit={handleSubmit(onEnviar)} className="flex flex-col gap-3">
      <FormField
        label="ID de resolución"
        required
        error={errors.codigo?.message}
        hint="Al guardarlo, la solicitud se cierra y el solicitante verá este ID."
      >
        {(a11y) => <Input {...a11y} autoComplete="off" {...register("codigo")} />}
      </FormField>
      <FormField label="Comentario para el solicitante" error={errors.comentario?.message}>
        {(a11y) => <Textarea {...a11y} rows={2} {...register("comentario")} />}
      </FormField>
      <div>
        <Button type="submit" loading={enviando} icon={<Check className="h-4 w-4" aria-hidden="true" />}>
          Marcar como resuelta
        </Button>
      </div>
    </form>
  );
}

/** Reenviar el enlace del formulario de una externa; permite corregir el correo alterno. */
function ReenviarEnlaceModal({
  open,
  onClose,
  solicitud: s,
  enviando,
  onEnviar,
}: {
  open: boolean;
  onClose: () => void;
  solicitud: SolicitudTecnica;
  enviando: boolean;
  onEnviar: (correo: string) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={enviando ? () => {} : onClose}
      size="sm"
      title={s.estado === "RECHAZADA" ? "Reabrir y enviar enlace" : "Reenviar enlace"}
      description={`#${s.idSolicitud} · ${s.nombreUsuario}`}
    >
      {open && <ReenviarEnlaceForm key={s.idSolicitud} correo={s.correoUsuario} onClose={onClose} enviando={enviando} onEnviar={onEnviar} />}
    </Modal>
  );
}

function ReenviarEnlaceForm({
  correo,
  onClose,
  enviando,
  onEnviar,
}: {
  correo: string;
  onClose: () => void;
  enviando: boolean;
  onEnviar: (correo: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReenviarEnlaceValues>({ resolver: zodResolver(reenviarEnlaceSchema), defaultValues: { correoAlterno: correo } });
  return (
    <form noValidate onSubmit={handleSubmit((v) => onEnviar(v.correoAlterno))} className="flex flex-col gap-4">
      <FormField
        label="Correo alterno"
        required
        error={errors.correoAlterno?.message}
        hint="Corrígelo si la persona no recibió el correo. El enlace anterior dejará de servir."
      >
        {(a11y) => <Input {...a11y} type="email" autoComplete="off" {...register("correoAlterno")} />}
      </FormField>
      <Alert tone="info">El enlace nuevo vence en {HORAS_ENLACE_EXTERNO} horas.</Alert>
      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={enviando}>
          Volver
        </Button>
        <Button type="submit" loading={enviando} icon={<MailPlus className="h-4 w-4" aria-hidden="true" />}>
          Enviar enlace
        </Button>
      </div>
    </form>
  );
}
