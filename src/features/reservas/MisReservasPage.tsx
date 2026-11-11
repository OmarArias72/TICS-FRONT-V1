"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, CalendarClock, CalendarDays, Check, Clock, MessageSquare, Pencil, UserRound, X } from "lucide-react";
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
  MotivoModal,
  PageContainer,
  PageHeader,
  PageLoader,
  Select,
  StatusBadge,
} from "@/components/ui";
import { FUNCIONES_BACKEND } from "@/lib/api/funcionesBackend";
import { cn } from "@/lib/cn";
import { esCodigo } from "@/lib/api/errors";
import { reservaSalasService, salaService } from "@/lib/api/services";
import { estadoUsoSala } from "@/lib/estados";
import { formatearDia, hoyISO } from "@/lib/fechas";
import { useAuthStore } from "@/store/authStore";
import type { SolicitudCambio, UsoSala, Sala } from "@/types/api";


import { clavesReservas } from "./claves";
import { empalmes, evaluarHorario, MENSAJE_LIMITE_PROFESOR } from "./reglas";

/**
 * Reservas del profesor (`GET /reservas-salas/mis-reservas`, backend v4.1):
 * las propias desde hace 7 días.
 *
 * - Cancelar: hasta el día anterior (`editablePorProfesor`; si no, MISMO_DIA).
 * - Modificar sala, fecha u horario: solo con una solicitud de cambio del
 *   Admin/Operador que el profesor aceptó (SIN_CAMBIO_ACEPTADO). El profesor
 *   no puede cambiar una reserva por su cuenta: puede cancelarla y hacer otra.
 *   Al aceptar, la tarjeta se actualiza al momento y se abre "Modificar".
 *
 * Admin (2026-11-05): modifica y cancela sus reservas directamente mientras no
 * hayan terminado (`PUT /mis-reservas/{id}/editar`), incluidas las que registró
 * para un profesor sin cuenta (`profesorExterno`), cuyo nombre puede corregir.
 */
/** La reserva aún no termina (el Admin puede cambiarla hasta entonces). */
function sinTerminar(r: UsoSala): boolean {
  return new Date(r.fechaFin).getTime() > Date.now();
}

export function MisReservasPage() {
  const idUsuario = useAuthStore((s) => s.user?.idUsuario);
  const esAdmin = useAuthStore((s) => s.user?.nombreRol === "Admin");
  const queryClient = useQueryClient();

  const [cancelando, setCancelando] = useState<UsoSala | null>(null);
  const [aceptando, setAceptando] = useState<UsoSala | null>(null);
  const [rechazando, setRechazando] = useState<UsoSala | null>(null);
  const [modificando, setModificando] = useState<UsoSala | null>(null);

  const disponible = FUNCIONES_BACKEND.misReservas;
  const cambiosDisponibles = FUNCIONES_BACKEND.solicitudesCambio;

  const query = useQuery({
    queryKey: clavesReservas.misReservas(idUsuario),
    queryFn: reservaSalasService.misReservas,
    enabled: disponible && idUsuario !== undefined,
    // Las solicitudes de cambio llegan de TIC: se revisa cada minuto y al volver a la pestaña.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  /** Aplica al momento un cambio en la caché (sin esperar la recarga del servidor). */
  const actualizarEnCache = (idUso: number, cambio: (r: UsoSala) => UsoSala) =>
    queryClient.setQueryData<UsoSala[]>(clavesReservas.misReservas(idUsuario), (lista) =>
      lista?.map((r) => (r.idUso === idUso ? cambio(r) : r)),
    );

  const salasQuery = useQuery({
    queryKey: clavesReservas.salas,
    queryFn: salaService.listarTodas,
    enabled: disponible,
  });

  /** Tras un error de estado (otro cambio llegó antes), se recargan los datos. */
  const alFallar = (err: Error) => {
    toast.error(err.message);
    if (esCodigo(err, "MISMO_DIA", "SIN_CAMBIO_ACEPTADO", "CAMBIO_VIGENTE", "NO_ENCONTRADO")) refrescar();
  };

  const refrescar = () => {
    void queryClient.invalidateQueries({ queryKey: clavesReservas.misReservas() });
    void queryClient.invalidateQueries({ queryKey: clavesReservas.agenda() });
  };

  const cancelar = useMutation({
    mutationFn: ({ idUso, motivo }: { idUso: number; motivo: string }) =>
      reservaSalasService.cancelarMiReserva(idUso, { motivoCancelacion: motivo }),
    onSuccess: (r) => {
      actualizarEnCache(r.idUso, () => r);
      refrescar();
      toast.success("Reserva cancelada");
      setCancelando(null);
    },
    onError: alFallar,
  });

  const responder = useMutation({
    mutationFn: ({ id, acepta, respuesta }: { id: number; acepta: boolean; respuesta?: string; reserva: UsoSala }) =>
      reservaSalasService.responderCambio(id, { acepta, respuesta }),
    onSuccess: (cambio: SolicitudCambio, v) => {
      // La tarjeta cambia al momento: con el cambio aceptado aparece "Modificar reserva";
      // rechazado, deja de estar vigente. Después se recarga del servidor.
      const actualizada: UsoSala = { ...v.reserva, solicitudCambio: v.acepta ? cambio : null };
      actualizarEnCache(v.reserva.idUso, () => actualizada);
      refrescar();
      setAceptando(null);
      setRechazando(null);
      if (v.acepta) {
        toast.success("Aceptaste el cambio; elige la nueva sala, fecha u horario");
        setModificando(actualizada);
      } else {
        toast.success("Respuesta enviada");
      }
    },
    onError: alFallar,
  });

  // ?reserva=<id> (desde "Mis solicitudes" o el aviso de Reserva de Salas): se resalta esa
  // tarjeta y se desplaza hasta ella cuando la lista ya cargó.
  const resaltada = Number(useSearchParams().get("reserva")) || null;
  const cargada = query.isSuccess;
  useEffect(() => {
    if (!cargada || resaltada === null) return;
    requestAnimationFrame(() =>
      document.getElementById(`reserva-${resaltada}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  }, [cargada, resaltada]);

  const reservas = [...(query.data ?? [])].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio),
  );

  return (
    <PageContainer narrow>
      <PageHeader
        eyebrow="Reserva de Salas"
        title="Mis reservas"
        description={
          esAdmin
            ? "Tus reservas de los últimos 7 días en adelante, incluidas las que registraste para profesores sin cuenta."
            : "Tus reservas de los últimos 7 días en adelante y las solicitudes de cambio de TICS."
        }
        actions={
          <ButtonLink href="/reservas" variant="secondary" icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}>
            Volver a reservas
          </ButtonLink>
        }
      />

      <Alert tone="info">
        {esAdmin
          ? "Como administrador puedes modificar o cancelar tus reservas en cualquier momento antes de que terminen."
          : MENSAJE_LIMITE_PROFESOR}
      </Alert>

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
            // Profesor: lo decide el backend (no cancelada y a partir de mañana).
            // Admin: mientras no haya terminado.
            const aTiempo = esAdmin ? activa && sinTerminar(r) : r.editablePorProfesor;
            const cambio = r.solicitudCambio;
            return (
              <li key={r.idUso} id={`reserva-${r.idUso}`} className="scroll-mt-24">
                <Card
                  className={cn(
                    "flex flex-col gap-4 p-5",
                    // Un cambio que espera respuesta se resalta, y más si se llegó desde un aviso
                    activa && cambio?.estado === "Pendiente" && "border-2 border-dorado",
                    resaltada === r.idUso && "ring-4 ring-dorado/50",
                  )}
                >
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
                      {r.profesorExterno && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold">
                          <UserRound className="h-3.5 w-3.5 text-sobre-variante" aria-hidden="true" />
                          Para {r.profesorExterno}
                          <span className="rounded-full bg-info-claro px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-info-oscuro">
                            Sin cuenta
                          </span>
                        </p>
                      )}
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

                  {r.estado === "Cancelada" && (
                    <p className="rounded-xl bg-superficie px-4 py-3 text-[13px] text-sobre-variante">
                      <span className="font-bold">Cancelada:</span> {r.motivoCancelacion ?? "sin motivo registrado"}
                      {r.adminModifico ? ` (${r.adminModifico})` : ""}
                    </p>
                  )}
                  {r.estado === "Reasignada" && r.adminModifico && (
                    <p className="text-[13px] text-sobre-variante">Reasignada por {r.adminModifico}.</p>
                  )}

                  {activa && (
                    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-variante pt-3">
                      {!aTiempo && (
                        <p className="mr-auto text-[13px] text-sobre-variante">
                          {esAdmin
                            ? "La reserva ya terminó."
                            : "Para cambios de hoy o de días pasados, comunícate con TIC."}
                        </p>
                      )}
                      {esAdmin && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!aTiempo}
                          icon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
                          onClick={() => setModificando(r)}
                        >
                          Modificar
                        </Button>
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
          responder.mutate({ id: aceptando.solicitudCambio.idSolicitudCambio, acepta: true, reserva: aceptando })
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
          responder.mutate({
            id: rechazando.solicitudCambio.idSolicitudCambio,
            acepta: false,
            respuesta,
            reserva: rechazando,
          })
        }
      />

      <ModificarMiReservaModal
        reserva={modificando}
        salas={salasQuery.data ?? []}
        // El Admin edita directamente (sin solicitud de cambio); si además tiene un cambio
        // aceptado de un Operador, también se resuelve con la edición directa.
        modoAdmin={esAdmin}
        onClose={() => setModificando(null)}
        onTerminar={(r) => {
          if (r) actualizarEnCache(r.idUso, () => r);
          refrescar();
        }}
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
  // Solo en modo Admin
  proposito: z.string().trim().max(1000, "Máximo 1000 caracteres"),
  profesorExterno: z.string().trim().max(150, "Máximo 150 caracteres"),
});
type ModificarValues = z.infer<typeof modificarSchema>;

interface ModificarProps {
  reserva: UsoSala | null;
  salas: Sala[];
  /** Admin: edición directa con propósito y profesor sin cuenta. */
  modoAdmin: boolean;
  onClose: () => void;
  /** Con la reserva ya guardada (o sin ella si hubo que recargar). */
  onTerminar: (r?: UsoSala) => void;
}

export function ModificarMiReservaModal({ reserva, ...props }: ModificarProps) {
  return (
    <Modal
      open={reserva !== null}
      onClose={props.onClose}
      title={props.modoAdmin ? "Modificar reserva" : "Modificar mi reserva"}
      description={
        props.modoAdmin
          ? "Cambia la sala, el horario, el propósito o el profesor. El nuevo horario debe estar libre."
          : "Elige un horario libre; se aplican las mismas reglas que a una reserva nueva."
      }
    >
      {reserva && <ModificarForm key={reserva.idUso} reserva={reserva} {...props} />}
    </Modal>
  );
}

function ModificarForm({ reserva, salas, modoAdmin, onClose, onTerminar }: ModificarProps & { reserva: UsoSala }) {
  const [iniciales] = useState<ModificarValues>(() => ({
    idSala: String(reserva.idSala),
    fecha: reserva.fecha,
    horaInicio: reserva.horaInicio,
    horaFin: reserva.horaFin,
    proposito: reserva.proposito ?? "",
    profesorExterno: reserva.profesorExterno ?? "",
  }));
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ModificarValues>({ resolver: zodResolver(modificarSchema), defaultValues: iniciales });
  const [idSala, fecha, horaInicio, horaFin, proposito, profesorExterno] = useWatch({
    control,
    name: ["idSala", "fecha", "horaInicio", "horaFin", "proposito", "profesorExterno"],
  });

  const agendaQuery = useQuery({
    queryKey: clavesReservas.agenda(Number(idSala), fecha),
    queryFn: () => reservaSalasService.obtenerAgenda(Number(idSala), fecha),
    enabled: Boolean(idSala && fecha),
  });
  // La propia reserva no cuenta como empalme.
  const otras = (agendaQuery.data ?? []).filter((u) => u.idUso !== reserva.idUso);
  // Ocupación de la sala y el día elegidos (sin canceladas), para escoger un hueco libre.
  const ocupacion = (agendaQuery.data ?? [])
    .filter((u) => u.estado !== "Cancelada")
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  const choques = new Set(
    horaInicio && horaFin && horaFin > horaInicio ? empalmes({ fecha, horaInicio, horaFin }, otras).map((u) => u.idUso) : [],
  );
  const salaElegida = salas.find((s) => String(s.idSala) === idSala);
  const mismoHorario =
    idSala === iniciales.idSala && fecha === iniciales.fecha && horaInicio === iniciales.horaInicio && horaFin === iniciales.horaFin;
  // El Admin no tiene el límite de 30 días; si no cambia el horario (solo el propósito o el
  // profesor), se permite aunque la reserva ya esté en curso.
  const evaluacion =
    modoAdmin && mismoHorario ? ({ tipo: "directa" } as const) : evaluarHorario({ fecha, horaInicio, horaFin }, otras, modoAdmin);
  const sinCambios =
    mismoHorario &&
    (!modoAdmin ||
      (proposito.trim() === iniciales.proposito.trim() && profesorExterno.trim() === iniciales.profesorExterno.trim()));

  const mutation = useMutation({
    mutationFn: (v: ModificarValues) =>
      modoAdmin
        ? reservaSalasService.editarReservaAdmin(reserva.idUso, {
            idSalaDestino: Number(v.idSala),
            fecha: v.fecha,
            horaInicio: v.horaInicio,
            horaFin: v.horaFin,
            proposito: v.proposito || null,
            profesorExterno: v.profesorExterno || null,
          })
        : reservaSalasService.modificarMiReserva(reserva.idUso, {
            idSolicitudCambio: reserva.solicitudCambio!.idSolicitudCambio,
            idSalaDestino: Number(v.idSala),
            fecha: v.fecha,
            horaInicio: v.horaInicio,
            horaFin: v.horaFin,
          }),
    onSuccess: (r) => {
      onTerminar(r);
      toast.success("Reserva modificada");
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message);
      if (esCodigo(err, "SIN_CAMBIO_ACEPTADO", "MISMO_DIA", "RESERVA_TERMINADA")) {
        onTerminar();
        onClose();
      }
    },
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
        {modoAdmin && (
          <>
            <FormField label="Propósito" error={errors.proposito?.message} className="sm:col-span-2">
              {(a11y) => <Input {...a11y} autoComplete="off" {...register("proposito")} />}
            </FormField>
            <FormField
              label="Profesor sin cuenta (opcional)"
              error={errors.profesorExterno?.message}
              hint="Déjalo vacío si la reserva es para ti."
              className="sm:col-span-2"
            >
              {(a11y) => <Input {...a11y} autoComplete="off" {...register("profesorExterno")} />}
            </FormField>
          </>
        )}
      </div>

      <section aria-labelledby="ocupacion-modificar" className="rounded-xl bg-superficie p-4">
        <h3 id="ocupacion-modificar" className="mb-2 text-xs font-bold uppercase tracking-[0.06em] text-dorado-texto">
          Reservas de {salaElegida?.codigoSala ?? "la sala"} el {fecha ? formatearDia(fecha) : "día elegido"}
        </h3>
        {!idSala || !fecha ? (
          <p className="text-sm text-sobre-variante">Elige la sala y la fecha para ver sus horarios.</p>
        ) : agendaQuery.isPending ? (
          <p className="text-sm text-sobre-variante">Consultando agenda...</p>
        ) : agendaQuery.isError ? (
          <p className="text-sm text-error">{agendaQuery.error.message}</p>
        ) : ocupacion.length === 0 ? (
          <p className="text-sm text-sobre-variante">La sala está libre todo el día.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {ocupacion.map((u) => {
              const propia = u.idUso === reserva.idUso;
              const choca = choques.has(u.idUso);
              return (
                <li
                  key={u.idUso}
                  className={cn(
                    "flex flex-wrap items-center gap-x-2 rounded-lg px-3 py-1.5 text-sm",
                    choca ? "bg-error-claro text-error-oscuro" : propia ? "bg-verde-claro text-verde-oscuro" : "bg-white",
                  )}
                >
                  <span className="font-bold">
                    {u.horaInicio}–{u.horaFin}
                  </span>
                  <span className={cn(!choca && !propia && "text-sobre-variante")}>
                    · {propia ? "Tu reserva actual" : u.profesor}
                    {!propia && u.proposito ? ` · ${u.proposito}` : ""}
                  </span>
                  {choca && <span className="ml-auto text-[11px] font-extrabold uppercase">Se empalma</span>}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-[12px] text-sobre-variante">Elige un horario que no se empalme con las reservas de la lista.</p>
      </section>

      {evaluacion.tipo === "directa" ? (
        !sinCambios && !mismoHorario && <Alert tone="ok">Horario disponible.</Alert>
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
