"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, CalendarClock, CalendarDays, Check, Clock, MessageSquare, Pencil, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";

import {
  Alert,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  EmptyState,
  FormField,
  Input,
  Modal,
  PageContainer,
  PageHeader,
  PageLoader,
  Select,
  StatusBadge,
} from "@/components/ui";
import { FUNCIONES_BACKEND } from "@/lib/api/funcionesBackend";
import { reservaSalasService, salaService } from "@/lib/api/services";
import { estadoUsoSala } from "@/lib/estados";
import { formatearDia, hoyISO } from "@/lib/fechas";
import { useAuthStore } from "@/store/authStore";
import type { MiReserva, Sala } from "@/types/api";

import { MotivoModal } from "./AccionesReservaModals";
import { clavesReservas } from "./claves";
import { evaluarHorario, MENSAJE_LIMITE_PROFESOR, profesorPuedeCambiar } from "./reglas";

/**
 * Reservas del profesor (nueva pantalla, 2026-10-30).
 *
 * - Cancelar su reserva: hasta el día anterior.
 * - Modificar sala, fecha u horario: solo si el admin envió una solicitud de
 *   cambio y el profesor la aceptó, y también hasta el día anterior.
 *
 * Depende de endpoints pendientes en el backend (FUNCIONES_BACKEND.misReservas
 * y .solicitudesCambio).
 */
export function MisReservasPage() {
  const idUsuario = useAuthStore((s) => s.user?.idUsuario);
  const queryClient = useQueryClient();

  const [cancelando, setCancelando] = useState<MiReserva | null>(null);
  const [aceptando, setAceptando] = useState<MiReserva | null>(null);
  const [rechazando, setRechazando] = useState<MiReserva | null>(null);
  const [modificando, setModificando] = useState<MiReserva | null>(null);

  const disponible = FUNCIONES_BACKEND.misReservas;
  const cambiosDisponibles = FUNCIONES_BACKEND.solicitudesCambio;

  const query = useQuery({
    queryKey: clavesReservas.misReservas(idUsuario),
    queryFn: () => reservaSalasService.misReservas(idUsuario!),
    enabled: disponible && idUsuario !== undefined,
  });

  const salasQuery = useQuery({
    queryKey: clavesReservas.salas,
    queryFn: salaService.listarTodas,
    enabled: disponible,
  });

  const refrescar = () => {
    void queryClient.invalidateQueries({ queryKey: clavesReservas.misReservas() });
    void queryClient.invalidateQueries({ queryKey: clavesReservas.agenda() });
  };

  const cancelar = useMutation({
    mutationFn: ({ idUso, motivo }: { idUso: number; motivo: string }) =>
      reservaSalasService.cancelarMiReserva(idUso, { idUsuario: idUsuario!, motivoCancelacion: motivo }),
    onSuccess: () => {
      refrescar();
      toast.success("Reserva cancelada");
      setCancelando(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const responder = useMutation({
    mutationFn: ({ id, acepta, respuesta }: { id: number; acepta: boolean; respuesta?: string }) =>
      reservaSalasService.responderCambio(id, { idUsuario: idUsuario!, acepta, respuesta }),
    onSuccess: (_d, v) => {
      refrescar();
      toast.success(v.acepta ? "Aceptaste el cambio; ya puedes modificar tu reserva" : "Respuesta enviada");
      setAceptando(null);
      setRechazando(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reservas = [...(query.data ?? [])].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio),
  );

  return (
    <PageContainer narrow>
      <PageHeader
        eyebrow="Reserva de Salas"
        title="Mis reservas"
        description="Tus reservas confirmadas desde hoy, y las solicitudes de cambio de la administración."
        actions={
          <ButtonLink href="/reservas" variant="secondary" icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}>
            Volver a reservas
          </ButtonLink>
        }
      />

      <Alert tone="info">{MENSAJE_LIMITE_PROFESOR}</Alert>

      {!disponible ? (
        <Alert tone="neutro" title="Pendiente de backend.">
          El servidor todavía no tiene el endpoint para consultar, cancelar o modificar tus reservas. Mientras
          tanto, puedes ver tus reservas en la agenda de cada sala.
        </Alert>
      ) : query.isPending ? (
        <PageLoader label="Cargando reservas..." />
      ) : query.isError ? (
        <Alert tone="error">{query.error.message}</Alert>
      ) : reservas.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-8 w-8" aria-hidden="true" />}
          title="No tienes reservas próximas"
          action={<ButtonLink href="/reservas">Reservar una sala</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {reservas.map((r) => {
            const activa = r.estado !== "Cancelada";
            const aTiempo = profesorPuedeCambiar(r.fecha);
            const cambio = r.solicitudCambio;
            return (
              <li key={r.idUso}>
                <Card className="flex flex-col gap-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold tracking-[0.06em] text-dorado-texto">
                        {r.codigoSala}
                        {r.nombreSala ? ` · ${r.nombreSala}` : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-4 text-base font-extrabold">
                        <span className="flex items-center gap-1.5 capitalize">
                          <CalendarDays className="h-4 w-4 text-sobre-variante" aria-hidden="true" />
                          {formatearDia(r.fecha)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-sobre-variante" aria-hidden="true" />
                          {r.horaInicio} – {r.horaFin}
                        </span>
                      </div>
                      {r.proposito && <p className="mt-1 text-[13px] text-sobre-variante">{r.proposito}</p>}
                    </div>
                    <StatusBadge {...estadoUsoSala(r.estado)} />
                  </div>

                  {activa && cambio?.estado === "Pendiente" && (
                    <div className="flex flex-col gap-3 rounded-xl bg-info-claro px-4 py-3.5 text-info-oscuro">
                      <p className="flex items-center gap-2 text-sm font-bold">
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                        {cambio.admin} te pide cambiar esta reserva de sala o fecha
                      </p>
                      <p className="text-sm leading-relaxed">{cambio.mensaje}</p>
                      {aTiempo ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            disabled={!cambiosDisponibles}
                            icon={<Check className="h-3.5 w-3.5" aria-hidden="true" />}
                            onClick={() => setAceptando(r)}
                          >
                            Aceptar cambio
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!cambiosDisponibles}
                            icon={<X className="h-3.5 w-3.5" aria-hidden="true" />}
                            onClick={() => setRechazando(r)}
                          >
                            No puedo cambiarla
                          </Button>
                        </div>
                      ) : (
                        <p className="text-[13px]">El plazo para responder terminó; TICS decidirá el cambio.</p>
                      )}
                    </div>
                  )}

                  {activa && cambio?.estado === "Aceptada" && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-verde-claro px-4 py-3.5 text-verde-oscuro">
                      <p className="text-sm font-semibold">
                        Aceptaste el cambio. Elige la nueva sala, fecha u horario
                        {aTiempo ? " antes del día de la reserva." : "; el plazo terminó y TICS hará la reasignación."}
                      </p>
                      {aTiempo && (
                        <Button
                          size="sm"
                          disabled={!cambiosDisponibles}
                          icon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
                          onClick={() => setModificando(r)}
                        >
                          Modificar reserva
                        </Button>
                      )}
                    </div>
                  )}

                  {activa && (
                    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-variante pt-3">
                      {!aTiempo && (
                        <p className="mr-auto text-[13px] text-sobre-variante">
                          Ya no puedes cancelarla; contacta a TICS si necesitas un cambio.
                        </p>
                      )}
                      <Button
                        size="sm"
                        variant="danger-outline"
                        disabled={!aTiempo}
                        icon={<Ban className="h-3.5 w-3.5" aria-hidden="true" />}
                        onClick={() => setCancelando(r)}
                      >
                        Cancelar reserva
                      </Button>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <MotivoModal
        open={cancelando !== null}
        onClose={() => setCancelando(null)}
        claveForm={cancelando?.idUso ?? 0}
        title="Cancelar reserva"
        description={
          cancelando
            ? `${cancelando.codigoSala} · ${formatearDia(cancelando.fecha)} ${cancelando.horaInicio}–${cancelando.horaFin}`
            : undefined
        }
        etiquetaBoton="Cancelar reserva"
        icono={<Ban className="h-4 w-4" aria-hidden="true" />}
        enviando={cancelar.isPending}
        onEnviar={(motivo) => cancelando && cancelar.mutate({ idUso: cancelando.idUso, motivo })}
      />

      <ConfirmDialog
        open={aceptando !== null}
        onClose={() => setAceptando(null)}
        tone="default"
        title="Aceptar el cambio"
        description="Después podrás elegir otra sala, fecha u horario para esta reserva, hasta el día anterior."
        confirmLabel="Aceptar"
        loading={responder.isPending}
        onConfirm={() =>
          aceptando?.solicitudCambio &&
          responder.mutate({ id: aceptando.solicitudCambio.idSolicitudCambio, acepta: true })
        }
      />

      <MotivoModal
        open={rechazando !== null}
        onClose={() => setRechazando(null)}
        claveForm={rechazando?.idUso ?? 0}
        title="Responder a la administración"
        description="Explica por qué no puedes cambiar la reserva; TICS lo tomará en cuenta."
        etiquetaCampo="Respuesta"
        etiquetaBoton="Enviar respuesta"
        varianteBoton="primary"
        icono={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
        enviando={responder.isPending}
        onEnviar={(respuesta) =>
          rechazando?.solicitudCambio &&
          responder.mutate({ id: rechazando.solicitudCambio.idSolicitudCambio, acepta: false, respuesta })
        }
      />

      <ModificarMiReservaModal
        reserva={modificando}
        salas={salasQuery.data ?? []}
        idUsuario={idUsuario}
        onClose={() => setModificando(null)}
        onTerminar={refrescar}
      />
    </PageContainer>
  );
}

/* ================================================================
 * Modificar mi reserva (con un cambio aceptado)
 * ================================================================ */

const modificarSchema = z.object({
  idSala: z.string().min(1, "Elige una sala"),
  fecha: z.string().min(1, "Elige una fecha"),
  horaInicio: z.string().min(1, "Elige la hora de inicio"),
  horaFin: z.string().min(1, "Elige la hora de fin"),
});
type ModificarValues = z.infer<typeof modificarSchema>;

interface ModificarProps {
  reserva: MiReserva | null;
  salas: Sala[];
  idUsuario: number | undefined;
  onClose: () => void;
  onTerminar: () => void;
}

function ModificarMiReservaModal({ reserva, ...props }: ModificarProps) {
  return (
    <Modal
      open={reserva !== null}
      onClose={props.onClose}
      title="Modificar mi reserva"
      description="Elige un horario libre; se aplican las mismas reglas que a una reserva nueva."
    >
      {reserva && <ModificarForm key={reserva.idUso} reserva={reserva} {...props} />}
    </Modal>
  );
}

function ModificarForm({ reserva, salas, idUsuario, onClose, onTerminar }: ModificarProps & { reserva: MiReserva }) {
  const [iniciales] = useState<ModificarValues>(() => ({
    idSala: String(reserva.idSala),
    fecha: reserva.fecha,
    horaInicio: reserva.horaInicio,
    horaFin: reserva.horaFin,
  }));
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ModificarValues>({ resolver: zodResolver(modificarSchema), defaultValues: iniciales });
  const [idSala, fecha, horaInicio, horaFin] = useWatch({ control, name: ["idSala", "fecha", "horaInicio", "horaFin"] });

  const agendaQuery = useQuery({
    queryKey: clavesReservas.agenda(Number(idSala), fecha),
    queryFn: () => reservaSalasService.obtenerAgenda(Number(idSala), fecha),
    enabled: Boolean(idSala && fecha),
  });
  // La propia reserva no cuenta como empalme.
  const otras = (agendaQuery.data ?? []).filter((u) => u.idUso !== reserva.idUso);
  const evaluacion = evaluarHorario({ fecha, horaInicio, horaFin }, otras);
  const sinCambios =
    idSala === iniciales.idSala && fecha === iniciales.fecha && horaInicio === iniciales.horaInicio && horaFin === iniciales.horaFin;

  const mutation = useMutation({
    mutationFn: (v: ModificarValues) =>
      reservaSalasService.modificarMiReserva(reserva.idUso, {
        idUsuario: idUsuario!,
        idSolicitudCambio: reserva.solicitudCambio!.idSolicitudCambio,
        idSalaDestino: Number(v.idSala),
        fecha: v.fecha,
        horaInicio: v.horaInicio,
        horaFin: v.horaFin,
      }),
    onSuccess: () => {
      onTerminar();
      toast.success("Reserva modificada");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Sala" required error={errors.idSala?.message}>
          {(a11y) => (
            <Select {...a11y} {...register("idSala")}>
              {salas.map((s) => (
                <option key={s.idSala} value={String(s.idSala)}>
                  {s.codigoSala} · {s.nombre ?? ""}
                </option>
              ))}
            </Select>
          )}
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

      {evaluacion.tipo === "directa" ? (
        !sinCambios && <Alert tone="ok">Horario disponible.</Alert>
      ) : (
        <Alert tone={evaluacion.tipo === "invalido" ? "error" : "alerta"}>
          {evaluacion.motivo} Elige otro horario.
        </Alert>
      )}

      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
          Volver
        </Button>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={evaluacion.tipo !== "directa" || sinCambios}
          icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
        >
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
