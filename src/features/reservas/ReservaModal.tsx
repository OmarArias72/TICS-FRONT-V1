"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Send } from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";

import { Alert, Button, FormField, Input, Modal, Textarea } from "@/components/ui";
import { reservaSalasService } from "@/lib/api/services";
import { formatearDia, hoyISO } from "@/lib/fechas";
import { useAuthStore } from "@/store/authStore";
import type { Sala } from "@/types/api";

import { clavesReservas } from "./claves";
import { evaluarHorario } from "./reglas";

const reservaSchema = z.object({
  fecha: z.string().min(1, "Elige una fecha"),
  horaInicio: z.string().min(1, "Elige la hora de inicio"),
  horaFin: z.string().min(1, "Elige la hora de fin"),
  proposito: z.string().max(255, "Máximo 255 caracteres"),
  justificacion: z.string().max(1000, "Máximo 1000 caracteres"),
});

type ReservaFormValues = z.infer<typeof reservaSchema>;

interface ReservaModalProps {
  open: boolean;
  onClose: () => void;
  sala: Sala | null;
  /** Fecha con la que abre el formulario (la que se ve en la agenda). */
  fechaInicial: string;
}

/**
 * Nueva reserva o solicitud extraordinaria (antes RoomReservationModal.jsx).
 *
 * Decisión 2026-10-30: reserva directa por defecto. Si el horario choca con
 * otra reserva o supera la anticipación máxima, se explica el motivo y se
 * ofrece enviar una solicitud extraordinaria con justificación.
 */
export function ReservaModal({ open, onClose, sala, fechaInicial }: ReservaModalProps) {
  return (
    <Modal
      open={open && sala !== null}
      onClose={onClose}
      size="lg"
      title="Reservar sala"
      description={sala ? `${sala.codigoSala} · ${sala.nombre ?? ""}` : undefined}
    >
      {open && sala && (
        <ReservaForm key={`${sala.idSala}-${fechaInicial}`} sala={sala} fechaInicial={fechaInicial} onClose={onClose} />
      )}
    </Modal>
  );
}

function ReservaForm({ sala, fechaInicial, onClose }: { sala: Sala; fechaInicial: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const idUsuario = useAuthStore((s) => s.user?.idUsuario);
  // Si el backend rechaza la reserva directa (por ejemplo, alguien reservó
  // ese horario un momento antes), se pasa a solicitud con su mensaje.
  const [rechazoDirecta, setRechazoDirecta] = useState<string | null>(null);

  const [iniciales] = useState<ReservaFormValues>(() => ({
    fecha: fechaInicial < hoyISO() ? hoyISO() : fechaInicial,
    horaInicio: "",
    horaFin: "",
    proposito: "",
    justificacion: "",
  }));

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<ReservaFormValues>({ resolver: zodResolver(reservaSchema), defaultValues: iniciales });

  const [fecha, horaInicio, horaFin] = useWatch({ control, name: ["fecha", "horaInicio", "horaFin"] });

  const agendaQuery = useQuery({
    queryKey: clavesReservas.agenda(sala.idSala, fecha),
    queryFn: () => reservaSalasService.obtenerAgenda(sala.idSala, fecha),
    enabled: Boolean(fecha),
  });

  const evaluacion = evaluarHorario({ fecha, horaInicio, horaFin }, agendaQuery.data ?? []);
  const modo: "directa" | "solicitud" =
    evaluacion.tipo === "solicitud" || rechazoDirecta ? "solicitud" : "directa";
  const motivoSolicitud = rechazoDirecta ?? (evaluacion.tipo === "solicitud" ? evaluacion.motivo : null);

  const alTerminar = (mensaje: string) => {
    void queryClient.invalidateQueries({ queryKey: clavesReservas.agenda() });
    void queryClient.invalidateQueries({ queryKey: clavesReservas.misSolicitudes(idUsuario) });
    void queryClient.invalidateQueries({ queryKey: clavesReservas.pendientes });
    toast.success(mensaje);
    onClose();
  };

  const directa = useMutation({
    mutationFn: reservaSalasService.registrarReservaDirecta,
    onSuccess: () => alTerminar("Reserva confirmada"),
    onError: (err: Error) => {
      setRechazoDirecta(err.message);
      void agendaQuery.refetch();
    },
  });

  const solicitud = useMutation({
    mutationFn: reservaSalasService.registrarSolicitudExtra,
    onSuccess: () => alTerminar("Solicitud enviada; un administrador la revisará"),
    onError: (err: Error) => toast.error(err.message),
  });

  const enviar = (values: ReservaFormValues) => {
    if (!idUsuario) return;
    if (evaluacion.tipo === "invalido") {
      setError("root", { message: evaluacion.motivo });
      return;
    }
    const base = { idSala: sala.idSala, idUsuario, fecha: values.fecha, horaInicio: values.horaInicio, horaFin: values.horaFin };
    if (modo === "directa") {
      directa.mutate({ ...base, proposito: values.proposito.trim() });
    } else {
      if (!values.justificacion.trim()) {
        setError("justificacion", { message: "Explica por qué necesitas este horario" });
        return;
      }
      solicitud.mutate({ ...base, justificacion: values.justificacion.trim() });
    }
  };

  const enviando = directa.isPending || solicitud.isPending;
  const agendaDia = (agendaQuery.data ?? []).filter((u) => u.estado !== "Cancelada");

  return (
    <form noValidate onSubmit={handleSubmit(enviar)} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Fecha" required error={errors.fecha?.message}>
          {(a11y) => (
            <Input
              {...a11y}
              type="date"
              min={hoyISO()}
              {...register("fecha", { onChange: () => setRechazoDirecta(null) })}
            />
          )}
        </FormField>
        <FormField label="Hora de inicio" required error={errors.horaInicio?.message}>
          {(a11y) => (
            <Input {...a11y} type="time" {...register("horaInicio", { onChange: () => setRechazoDirecta(null) })} />
          )}
        </FormField>
        <FormField label="Hora de fin" required error={errors.horaFin?.message}>
          {(a11y) => (
            <Input {...a11y} type="time" {...register("horaFin", { onChange: () => setRechazoDirecta(null) })} />
          )}
        </FormField>
      </div>

      <section aria-labelledby="agenda-dia" className="rounded-xl bg-superficie p-4">
        <h3 id="agenda-dia" className="mb-2 text-xs font-bold uppercase tracking-[0.06em] text-dorado-texto">
          Ocupación del {fecha ? formatearDia(fecha) : "día"}
        </h3>
        {agendaQuery.isPending && fecha ? (
          <p className="text-sm text-sobre-variante">Consultando agenda...</p>
        ) : agendaDia.length === 0 ? (
          <p className="text-sm text-sobre-variante">La sala está libre todo el día.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {agendaDia.map((u) => (
              <li key={u.idUso} className="rounded-lg bg-white px-3 py-1.5 text-sm">
                <span className="font-bold">
                  {u.horaInicio}–{u.horaFin}
                </span>{" "}
                <span className="text-sobre-variante">· {u.profesor}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {horaInicio && horaFin && evaluacion.tipo === "invalido" && <Alert tone="error">{evaluacion.motivo}</Alert>}
      {modo === "directa" && evaluacion.tipo === "directa" && (
        <Alert tone="ok">Horario disponible: la reserva se confirma al momento.</Alert>
      )}
      {modo === "solicitud" && motivoSolicitud && (
        <Alert tone="alerta" title="No se puede reservar directamente.">
          {motivoSolicitud} Puedes enviar una solicitud extraordinaria; un administrador la aprobará o
          rechazará.
        </Alert>
      )}
      {errors.root?.message && <Alert tone="error">{errors.root.message}</Alert>}

      {modo === "directa" ? (
        <FormField label="Propósito" error={errors.proposito?.message} hint="Por ejemplo: Clase de Programación Estructurada">
          {(a11y) => <Input {...a11y} autoComplete="off" {...register("proposito")} />}
        </FormField>
      ) : (
        <FormField
          label="Justificación"
          required
          error={errors.justificacion?.message}
          hint="Explica por qué necesitas este horario; el administrador lo tomará en cuenta."
        >
          {(a11y) => <Textarea {...a11y} rows={3} {...register("justificacion")} />}
        </FormField>
      )}

      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={enviando}>
          Cancelar
        </Button>
        {modo === "directa" ? (
          <Button
            type="submit"
            loading={directa.isPending}
            disabled={evaluacion.tipo === "invalido"}
            icon={<CalendarCheck className="h-4 w-4" aria-hidden="true" />}
          >
            Confirmar reserva
          </Button>
        ) : (
          <Button
            type="submit"
            variant="accent"
            loading={solicitud.isPending}
            disabled={evaluacion.tipo === "invalido"}
            icon={<Send className="h-4 w-4" aria-hidden="true" />}
          >
            Enviar solicitud
          </Button>
        )}
      </div>
    </form>
  );
}
