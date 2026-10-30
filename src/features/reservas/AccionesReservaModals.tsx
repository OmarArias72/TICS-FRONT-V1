"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Ban, Check, MessageSquare, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";

import { Alert, Button, FormField, Input, Modal, Select, Textarea } from "@/components/ui";
import type { VarianteBoton } from "@/components/ui";
import { FUNCIONES_BACKEND } from "@/lib/api/funcionesBackend";
import { reservaSalasService } from "@/lib/api/services";
import { formatearDia, hoyISO } from "@/lib/fechas";
import type { Sala, SolicitudReserva, UsoSala } from "@/types/api";

import { clavesReservas } from "./claves";
import { empalmes } from "./reglas";

/* ================================================================
 * Utilidades comunes
 * ================================================================ */

const horarioSchema = z
  .object({
    idSala: z.string().min(1, "Elige una sala"),
    horaInicio: z.string().min(1, "Elige la hora de inicio"),
    horaFin: z.string().min(1, "Elige la hora de fin"),
  })
  .refine((v) => v.horaFin > v.horaInicio, {
    path: ["horaFin"],
    message: "La hora de fin debe ser posterior a la de inicio",
  });

const motivoSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(5, "Escribe un motivo de al menos 5 caracteres")
    .max(500, "Máximo 500 caracteres"),
});
type MotivoValues = z.infer<typeof motivoSchema>;

/** Invalida agenda y pendientes tras cualquier acción administrativa. */
function useAlTerminar(onClose: () => void) {
  const queryClient = useQueryClient();
  return (mensaje: string) => {
    void queryClient.invalidateQueries({ queryKey: clavesReservas.agenda() });
    void queryClient.invalidateQueries({ queryKey: clavesReservas.pendientes });
    void queryClient.invalidateQueries({ queryKey: clavesReservas.misReservas() });
    toast.success(mensaje);
    onClose();
  };
}

/** Aviso de empalme con la agenda de la sala destino. */
function AvisoEmpalme({ choques }: { choques: UsoSala[] }) {
  if (choques.length === 0) return null;
  return (
    <Alert tone="alerta" title="El horario se empalma con otra reserva.">
      {choques.map((u) => `${u.horaInicio}–${u.horaFin} (${u.profesor})`).join(", ")}. El servidor
      rechazará la operación; ajusta la sala o el horario.
    </Alert>
  );
}

function SelectSala({ salas, ...props }: { salas: Sala[] } & ComponentProps<typeof Select>) {
  return (
    <Select {...props}>
      {salas.map((s) => (
        <option key={s.idSala} value={String(s.idSala)}>
          {s.codigoSala} · {s.nombre ?? ""}
        </option>
      ))}
    </Select>
  );
}

/* ================================================================
 * Aprobar solicitud
 * ================================================================ */

type HorarioValues = z.infer<typeof horarioSchema>;

interface AprobarProps {
  solicitud: SolicitudReserva | null;
  salas: Sala[];
  idAdmin: number;
  onClose: () => void;
}

/** Aprobar una solicitud extraordinaria; permite cambiar la sala y el horario. */
export function AprobarSolicitudModal({ solicitud, salas, idAdmin, onClose }: AprobarProps) {
  return (
    <Modal
      open={solicitud !== null}
      onClose={onClose}
      title="Aprobar solicitud"
      description={
        solicitud ? `${solicitud.profesor} · ${formatearDia(solicitud.fecha)}` : undefined
      }
    >
      {solicitud && (
        <AprobarForm
          key={solicitud.idSolicitud}
          solicitud={solicitud}
          salas={salas}
          idAdmin={idAdmin}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function AprobarForm({ solicitud, salas, idAdmin, onClose }: AprobarProps & { solicitud: SolicitudReserva }) {
  const alTerminar = useAlTerminar(onClose);
  const [iniciales] = useState<HorarioValues>(() => ({
    idSala: String(solicitud.idSala),
    horaInicio: solicitud.horaInicio,
    horaFin: solicitud.horaFin,
  }));
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<HorarioValues>({ resolver: zodResolver(horarioSchema), defaultValues: iniciales });
  const [idSala, horaInicio, horaFin] = useWatch({ control, name: ["idSala", "horaInicio", "horaFin"] });

  const agendaQuery = useQuery({
    queryKey: clavesReservas.agenda(Number(idSala), solicitud.fecha),
    queryFn: () => reservaSalasService.obtenerAgenda(Number(idSala), solicitud.fecha),
    enabled: Boolean(idSala),
  });
  const choques =
    horaInicio && horaFin && horaFin > horaInicio
      ? empalmes({ fecha: solicitud.fecha, horaInicio, horaFin }, agendaQuery.data ?? [])
      : [];

  const mutation = useMutation({
    mutationFn: reservaSalasService.aprobarSolicitud,
    onSuccess: () => alTerminar("Solicitud aprobada; la reserva quedó confirmada"),
    onError: (err: Error) => toast.error(err.message),
  });

  const enviar = (v: HorarioValues) =>
    mutation.mutate({
      idSolicitud: solicitud.idSolicitud,
      idAdmin,
      idSalaDestino: Number(v.idSala),
      horaInicio: v.horaInicio,
      horaFin: v.horaFin,
    });

  return (
    <form noValidate onSubmit={handleSubmit(enviar)} className="flex flex-col gap-4">
      {solicitud.justificacion && (
        <p className="rounded-xl bg-superficie px-4 py-3 text-sm leading-relaxed text-sobre-variante">
          {solicitud.justificacion}
        </p>
      )}
      <FormField label="Sala" required error={errors.idSala?.message} hint="Puedes asignar otra sala si la solicitada está ocupada.">
        {(a11y) => <SelectSala {...a11y} salas={salas} {...register("idSala")} />}
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Hora de inicio" required error={errors.horaInicio?.message}>
          {(a11y) => <Input {...a11y} type="time" {...register("horaInicio")} />}
        </FormField>
        <FormField label="Hora de fin" required error={errors.horaFin?.message}>
          {(a11y) => <Input {...a11y} type="time" {...register("horaFin")} />}
        </FormField>
      </div>
      <AvisoEmpalme choques={choques} />
      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={choques.length > 0}
          icon={<Check className="h-4 w-4" aria-hidden="true" />}
        >
          Aprobar
        </Button>
      </div>
    </form>
  );
}

/* ================================================================
 * Rechazar solicitud / Cancelar reserva (ambos piden un motivo)
 * ================================================================ */

export interface MotivoModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  etiquetaBoton: string;
  icono: ReactNode;
  enviando: boolean;
  onEnviar: (motivo: string) => void;
  /** Cambia en cada apertura para reiniciar el formulario. */
  claveForm: string | number;
  /** Etiqueta del campo de texto (por defecto, "Motivo"). */
  etiquetaCampo?: string;
  hint?: string;
  varianteBoton?: VarianteBoton;
  /** Texto del botón para volver (por defecto, "Volver"). */
  etiquetaVolver?: string;
  /** Aviso sobre el formulario (por ejemplo, "Pendiente de backend"). */
  aviso?: ReactNode;
  deshabilitado?: boolean;
}

/** Modal con un solo campo de texto obligatorio (motivo o mensaje). */
export function MotivoModal({ open, onClose, claveForm, ...props }: MotivoModalProps) {
  return (
    <Modal open={open} onClose={props.enviando ? () => {} : onClose} size="sm" title={props.title} description={props.description}>
      {open && <MotivoForm key={claveForm} onClose={onClose} {...props} />}
    </Modal>
  );
}

function MotivoForm({
  onClose,
  etiquetaBoton,
  icono,
  enviando,
  onEnviar,
  etiquetaCampo = "Motivo",
  hint,
  varianteBoton = "danger",
  etiquetaVolver = "Volver",
  aviso,
  deshabilitado = false,
}: Omit<MotivoModalProps, "open" | "claveForm" | "title" | "description">) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MotivoValues>({ resolver: zodResolver(motivoSchema), defaultValues: { motivo: "" } });

  return (
    <form noValidate onSubmit={handleSubmit((v) => onEnviar(v.motivo))} className="flex flex-col gap-4">
      {aviso}
      <FormField label={etiquetaCampo} required error={errors.motivo?.message} hint={hint}>
        {(a11y) => <Textarea {...a11y} rows={3} {...register("motivo")} />}
      </FormField>
      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={enviando}>
          {etiquetaVolver}
        </Button>
        <Button type="submit" variant={varianteBoton} loading={enviando} disabled={deshabilitado} icon={icono}>
          {etiquetaBoton}
        </Button>
      </div>
    </form>
  );
}

export function RechazarSolicitudModal({
  solicitud,
  idAdmin,
  onClose,
}: {
  solicitud: SolicitudReserva | null;
  idAdmin: number;
  onClose: () => void;
}) {
  const alTerminar = useAlTerminar(onClose);
  const mutation = useMutation({
    mutationFn: reservaSalasService.rechazarSolicitud,
    onSuccess: () => alTerminar("Solicitud rechazada"),
    onError: (err: Error) => toast.error(err.message),
  });
  return (
    <MotivoModal
      open={solicitud !== null}
      onClose={onClose}
      claveForm={solicitud?.idSolicitud ?? 0}
      title="Rechazar solicitud"
      description={
        solicitud
          ? `${solicitud.profesor} · ${solicitud.codigoSala} · ${formatearDia(solicitud.fecha)} ${solicitud.horaInicio}–${solicitud.horaFin}`
          : undefined
      }
      etiquetaBoton="Rechazar"
      icono={<X className="h-4 w-4" aria-hidden="true" />}
      enviando={mutation.isPending}
      onEnviar={(motivo) =>
        solicitud && mutation.mutate({ idSolicitud: solicitud.idSolicitud, idAdmin, motivoRechazo: motivo })
      }
    />
  );
}

export function CancelarReservaModal({
  uso,
  fecha,
  idAdmin,
  onClose,
}: {
  uso: UsoSala | null;
  fecha: string;
  idAdmin: number;
  onClose: () => void;
}) {
  const alTerminar = useAlTerminar(onClose);
  const mutation = useMutation({
    mutationFn: reservaSalasService.cancelarReserva,
    onSuccess: () => alTerminar("Reserva cancelada"),
    onError: (err: Error) => toast.error(err.message),
  });
  return (
    <MotivoModal
      open={uso !== null}
      onClose={onClose}
      claveForm={uso?.idUso ?? 0}
      title="Cancelar reserva"
      description={
        uso ? `${uso.profesor} · ${uso.codigoSala} · ${formatearDia(fecha)} ${uso.horaInicio}–${uso.horaFin}` : undefined
      }
      etiquetaBoton="Cancelar reserva"
      icono={<Ban className="h-4 w-4" aria-hidden="true" />}
      enviando={mutation.isPending}
      onEnviar={(motivo) => uso && mutation.mutate({ idUso: uso.idUso, idAdmin, motivoCancelacion: motivo })}
    />
  );
}

/* ================================================================
 * Reasignar reserva
 * ================================================================ */

const reasignarSchema = z
  .object({
    idSala: z.string().min(1, "Elige una sala"),
    fecha: z.string().min(1, "Elige una fecha"),
    horaInicio: z.string().min(1, "Elige la hora de inicio"),
    horaFin: z.string().min(1, "Elige la hora de fin"),
  })
  .refine((v) => v.horaFin > v.horaInicio, {
    path: ["horaFin"],
    message: "La hora de fin debe ser posterior a la de inicio",
  })
  .refine((v) => v.fecha >= hoyISO(), { path: ["fecha"], message: "No se puede mover a una fecha pasada" });
type ReasignarValues = z.infer<typeof reasignarSchema>;

interface ReasignarProps {
  uso: UsoSala | null;
  /** Fecha de la agenda donde está el uso (el DTO no la incluye). */
  fecha: string;
  salas: Sala[];
  idAdmin: number;
  onClose: () => void;
}

/** Mover una reserva a otra sala, fecha u horario. */
export function ReasignarReservaModal({ uso, fecha, salas, idAdmin, onClose }: ReasignarProps) {
  return (
    <Modal
      open={uso !== null}
      onClose={onClose}
      title="Reasignar reserva"
      description={uso ? `${uso.profesor} · ${uso.proposito || "Sin propósito"}` : undefined}
    >
      {uso && (
        <ReasignarForm key={uso.idUso} uso={uso} fecha={fecha} salas={salas} idAdmin={idAdmin} onClose={onClose} />
      )}
    </Modal>
  );
}

function ReasignarForm({ uso, fecha, salas, idAdmin, onClose }: ReasignarProps & { uso: UsoSala }) {
  const alTerminar = useAlTerminar(onClose);
  const [iniciales] = useState<ReasignarValues>(() => ({
    idSala: String(uso.idSala),
    fecha: fecha < hoyISO() ? hoyISO() : fecha,
    horaInicio: uso.horaInicio,
    horaFin: uso.horaFin,
  }));
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ReasignarValues>({ resolver: zodResolver(reasignarSchema), defaultValues: iniciales });
  const [idSala, fechaDestino, horaInicio, horaFin] = useWatch({
    control,
    name: ["idSala", "fecha", "horaInicio", "horaFin"],
  });

  const agendaQuery = useQuery({
    queryKey: clavesReservas.agenda(Number(idSala), fechaDestino),
    queryFn: () => reservaSalasService.obtenerAgenda(Number(idSala), fechaDestino),
    enabled: Boolean(idSala && fechaDestino),
  });
  // La propia reserva no cuenta como empalme.
  const otras = (agendaQuery.data ?? []).filter((u) => u.idUso !== uso.idUso);
  const choques =
    horaInicio && horaFin && horaFin > horaInicio
      ? empalmes({ fecha: fechaDestino, horaInicio, horaFin }, otras)
      : [];

  const mutation = useMutation({
    mutationFn: reservaSalasService.reasignarReserva,
    onSuccess: () => alTerminar("Reserva reasignada"),
    onError: (err: Error) => toast.error(err.message),
  });

  const enviar = (v: ReasignarValues) =>
    mutation.mutate({
      idUso: uso.idUso,
      idAdmin,
      idSalaDestino: Number(v.idSala),
      fecha: v.fecha,
      horaInicio: v.horaInicio,
      horaFin: v.horaFin,
    });

  return (
    <form noValidate onSubmit={handleSubmit(enviar)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Sala" required error={errors.idSala?.message}>
          {(a11y) => <SelectSala {...a11y} salas={salas} {...register("idSala")} />}
        </FormField>
        <FormField label="Fecha" required error={errors.fecha?.message}>
          {(a11y) => <Input {...a11y} type="date" min={hoyISO()} {...register("fecha")} />}
        </FormField>
        <FormField label="Hora de inicio" required error={errors.horaInicio?.message}>
          {(a11y) => <Input {...a11y} type="time" {...register("horaInicio")} />}
        </FormField>
        <FormField label="Hora de fin" required error={errors.horaFin?.message}>
          {(a11y) => <Input {...a11y} type="time" {...register("horaFin")} />}
        </FormField>
      </div>
      <AvisoEmpalme choques={choques} />
      <p className="text-[13px] text-sobre-variante">
        {FUNCIONES_BACKEND.notificaciones
          ? "El profesor recibirá una notificación con la nueva sala y horario."
          : "Avisa al profesor del cambio: las notificaciones están pendientes de backend."}
      </p>
      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
          Volver
        </Button>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={choques.length > 0}
          icon={<ArrowRightLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Reasignar
        </Button>
      </div>
    </form>
  );
}

/* ================================================================
 * Solicitar cambio al profesor (pendiente de backend)
 * ================================================================ */

/**
 * El admin pide al profesor que cambie su reserva de sala o fecha. Si el
 * profesor acepta, él mismo la modifica desde "Mis reservas" (hasta el día
 * anterior); el admin conserva la opción de reasignar directamente.
 */
export function SolicitarCambioModal({
  uso,
  fecha,
  idAdmin,
  onClose,
}: {
  uso: UsoSala | null;
  fecha: string;
  idAdmin: number;
  onClose: () => void;
}) {
  const alTerminar = useAlTerminar(onClose);
  const disponible = FUNCIONES_BACKEND.solicitudesCambio;
  const mutation = useMutation({
    mutationFn: reservaSalasService.solicitarCambio,
    onSuccess: () => alTerminar("Solicitud de cambio enviada al profesor"),
    onError: (err: Error) => toast.error(err.message),
  });
  return (
    <MotivoModal
      open={uso !== null}
      onClose={onClose}
      claveForm={uso?.idUso ?? 0}
      title="Pedir cambio al profesor"
      description={
        uso ? `${uso.profesor} · ${uso.codigoSala} · ${formatearDia(fecha)} ${uso.horaInicio}–${uso.horaFin}` : undefined
      }
      etiquetaCampo="Mensaje para el profesor"
      hint="Explica por qué necesitas que cambie de sala o fecha. Si acepta, podrá modificar su reserva hasta el día anterior."
      etiquetaBoton="Enviar solicitud"
      varianteBoton="primary"
      icono={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
      enviando={mutation.isPending}
      deshabilitado={!disponible}
      aviso={
        !disponible && (
          <Alert tone="neutro" title="Pendiente de backend.">
            El servidor todavía no tiene el endpoint para enviar solicitudes de cambio.
          </Alert>
        )
      }
      onEnviar={(mensaje) => uso && mutation.mutate({ idUso: uso.idUso, idAdmin, mensaje })}
    />
  );
}
