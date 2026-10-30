"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, RotateCcw, Save } from "lucide-react";
import { toast } from "react-hot-toast";

import { Alert, Button, ConfirmDialog, FormField, Input, Modal, StatusBadge, Textarea } from "@/components/ui";
import { solicitudTecnicaService } from "@/lib/api/services";
import { estadoSolicitudTecnica } from "@/lib/estados";
import { formatearFecha } from "@/lib/fechas";
import { useAuthStore } from "@/store/authStore";
import type { SolicitudTecnica } from "@/types/api";

import { clavesMesaAyuda } from "./claves";
import { ESTADOS_CANCELABLES, ESTADOS_CON_FORMULARIO, nombreTipo } from "./flujo";
import { HistorialSolicitud } from "./HistorialSolicitud";
import { ProgresoSolicitud } from "./ProgresoSolicitud";
import { formularioSchema, reenviarSchema, REGEX_CURP, type FormularioValues, type ReenviarValues } from "./schemas";

interface DetalleProps {
  solicitud: SolicitudTecnica | null;
  idUsuario: number;
  onClose: () => void;
}

/**
 * Detalle de una solicitud para quien la envió (antes
 * DetalleSolicitudAlumnoModal.jsx): progreso, datos para TICS, reenvío si fue
 * rechazada, cancelación e historial.
 */
export function DetalleSolicitudModal({ solicitud, idUsuario, onClose }: DetalleProps) {
  return (
    <Modal
      open={solicitud !== null}
      onClose={onClose}
      size="lg"
      title={solicitud ? `Solicitud #${solicitud.idSolicitud}` : "Solicitud"}
      description={
        solicitud ? `${nombreTipo(solicitud.tipoNombre)} · enviada el ${formatearFecha(solicitud.fechaSolicitud)}` : undefined
      }
    >
      {solicitud && (
        <Detalle key={`${solicitud.idSolicitud}-${solicitud.estado}`} solicitud={solicitud} idUsuario={idUsuario} onClose={onClose} />
      )}
    </Modal>
  );
}

function Detalle({ solicitud, idUsuario, onClose }: DetalleProps & { solicitud: SolicitudTecnica }) {
  const queryClient = useQueryClient();
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);

  const alTerminar = (mensaje: string) => {
    void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.misSolicitudes(idUsuario) });
    toast.success(mensaje);
    onClose();
  };

  const cancelar = useMutation({
    mutationFn: () => solicitudTecnicaService.cancelarSolicitud(solicitud.idSolicitud, idUsuario),
    onSuccess: () => alTerminar("Solicitud cancelada"),
    onError: (err: Error) => toast.error(err.message),
  });

  const { estado } = solicitud;
  const ticket = solicitud.ticket;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge {...estadoSolicitudTecnica(estado)} />
        {solicitud.revisorNombre && (
          <span className="text-[13px] text-sobre-variante">Revisó: {solicitud.revisorNombre}</span>
        )}
      </div>
      <ProgresoSolicitud estado={estado} />

      {solicitud.motivo && (
        <div className="rounded-xl bg-superficie px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-sobre-variante">Motivo</p>
          <p className="mt-1 text-sm leading-relaxed">{solicitud.motivo}</p>
        </div>
      )}

      {estado === "PENDIENTE" && (
        <Alert tone="neutro">TICS revisará tu solicitud. Si la aprueba, te pedirá algunos datos para generar el ticket.</Alert>
      )}
      {estado === "RECHAZADA" && <ReenviarSolicitud solicitud={solicitud} idUsuario={idUsuario} onTerminar={alTerminar} />}
      {ESTADOS_CON_FORMULARIO.includes(estado) && (
        <FormularioDatos solicitud={solicitud} idUsuario={idUsuario} onTerminar={alTerminar} />
      )}
      {estado === "ESPERA_TICKET" && (
        <Alert tone="info">TICS está generando el ticket en ServiceDesk con tus datos.</Alert>
      )}
      {estado === "TICKET_CREADO" && (
        <Alert tone="info" title="TICS ya generó el ticket en la plataforma externa.">
          {ticket?.codigoTicketCreado && <>Número de ticket: {ticket.codigoTicketCreado}. </>}
          Te avisaremos cuando quede resuelto.
        </Alert>
      )}
      {(estado === "CERRADA" || estado === "RESUELTO") && (
        <Alert tone="ok" title="TICS resolvió tu solicitud.">
          Revisa tu correo institucional para seguir las instrucciones o verificar el acceso.
          {ticket?.codigoTicketResuelto && <> ID de resolución: {ticket.codigoTicketResuelto}.</>}
        </Alert>
      )}
      {estado === "CANCELADA" && <Alert tone="neutro">Cancelaste esta solicitud.</Alert>}

      {ESTADOS_CANCELABLES.includes(estado) && (
        <div className="flex justify-end border-t border-variante pt-4">
          <Button
            variant="danger-outline"
            size="sm"
            icon={<Ban className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={() => setConfirmarCancelar(true)}
          >
            Cancelar solicitud
          </Button>
        </div>
      )}

      {solicitud.historial && solicitud.historial.length > 0 && <HistorialSolicitud historial={solicitud.historial} />}

      <ConfirmDialog
        open={confirmarCancelar}
        onClose={() => setConfirmarCancelar(false)}
        onConfirm={() => cancelar.mutate()}
        loading={cancelar.isPending}
        title="Cancelar solicitud"
        description="TICS dejará de atenderla. Si la necesitas después, tendrás que enviar una nueva."
        confirmLabel="Cancelar solicitud"
        cancelLabel="Volver"
      />
    </div>
  );
}

/* ================================================================
 * Reenviar una solicitud rechazada
 * ================================================================ */

function ReenviarSolicitud({
  solicitud,
  idUsuario,
  onTerminar,
}: {
  solicitud: SolicitudTecnica;
  idUsuario: number;
  onTerminar: (mensaje: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReenviarValues>({
    resolver: zodResolver(reenviarSchema),
    defaultValues: { motivo: solicitud.motivo ?? "" },
  });
  const mutation = useMutation({
    mutationFn: (v: ReenviarValues) =>
      solicitudTecnicaService.reenviarSolicitud(solicitud.idSolicitud, idUsuario, { motivo: v.motivo }),
    onSuccess: () => onTerminar("Solicitud reenviada a TICS"),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-3">
      <Alert tone="error" title="TICS rechazó tu solicitud.">
        {solicitud.motivoRechazo ?? "Sin motivo registrado."}
      </Alert>
      {!editando ? (
        <div>
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={() => setEditando(true)}
          >
            Reenviar con más información
          </Button>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-3">
          <FormField label="Explica mejor tu situación" required error={errors.motivo?.message}>
            {(a11y) => <Textarea {...a11y} rows={3} {...register("motivo")} />}
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditando(false)} disabled={mutation.isPending}>
              Volver
            </Button>
            <Button type="submit" size="sm" loading={mutation.isPending}>
              Reenviar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ================================================================
 * Datos para generar el ticket
 * ================================================================ */

function FormularioDatos({
  solicitud,
  idUsuario,
  onTerminar,
}: {
  solicitud: SolicitudTecnica;
  idUsuario: number;
  onTerminar: (mensaje: string) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const enviado = solicitud.estado === "FORMULARIO_ENVIADO";

  const [iniciales] = useState<FormularioValues>(() => {
    const f = solicitud.formulario;
    if (f) {
      return {
        nombreCompleto: f.nombreCompleto,
        correoInstitucional: f.correoInstitucional,
        correoAlterno: f.correoAlterno ?? "",
        numeroCuenta: f.numeroCuenta,
        // Si el backend no pudo descifrarla, se pide de nuevo.
        curp: f.curp && REGEX_CURP.test(f.curp) ? f.curp : "",
        telefono: f.telefono ?? "",
        descripcionProblema: f.descripcionProblema ?? "",
      };
    }
    const correo = user?.correo ?? "";
    return {
      nombreCompleto: user ? `${user.nombre} ${user.apellidos ?? ""}`.trim() : "",
      correoInstitucional: correo.endsWith("@uaemex.mx") ? correo : "",
      correoAlterno: "",
      numeroCuenta: "",
      curp: "",
      telefono: "",
      descripcionProblema: "",
    };
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormularioValues>({ resolver: zodResolver(formularioSchema), defaultValues: iniciales });

  const mutation = useMutation({
    mutationFn: (v: FormularioValues) =>
      solicitudTecnicaService.llenarFormulario(solicitud.idSolicitud, idUsuario, {
        ...v,
        correoAlterno: v.correoAlterno || null,
        telefono: v.telefono || null,
        descripcionProblema: v.descripcionProblema || null,
      }),
    onSuccess: () => onTerminar(enviado ? "Datos actualizados" : "Datos enviados a TICS"),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      className="flex flex-col gap-4 rounded-2xl border border-variante p-5"
      aria-labelledby="titulo-datos"
    >
      <div>
        <h3 id="titulo-datos" className="text-base font-extrabold">
          {enviado ? "Tus datos enviados" : "Completa tus datos para generar el ticket"}
        </h3>
        <p className="mt-1 text-[13px] text-sobre-variante">
          {enviado
            ? "Puedes corregirlos hasta que TICS tome tu solicitud."
            : "TICS aprobó tu solicitud. Estos datos se usan solo para el ticket de ServiceDesk."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Nombre completo" required error={errors.nombreCompleto?.message} className="sm:col-span-2">
          {(a11y) => <Input {...a11y} autoComplete="name" {...register("nombreCompleto")} />}
        </FormField>
        <FormField label="Correo institucional" required error={errors.correoInstitucional?.message}>
          {(a11y) => <Input {...a11y} type="email" autoComplete="email" placeholder="usuario@uaemex.mx" {...register("correoInstitucional")} />}
        </FormField>
        <FormField
          label="Correo alterno"
          error={errors.correoAlterno?.message}
          hint="Para contactarte si no puedes entrar a tu correo institucional."
        >
          {(a11y) => <Input {...a11y} type="email" {...register("correoAlterno")} />}
        </FormField>
        <FormField label="Número de cuenta" required error={errors.numeroCuenta?.message}>
          {(a11y) => <Input {...a11y} inputMode="numeric" maxLength={7} {...register("numeroCuenta")} />}
        </FormField>
        <FormField label="Teléfono" error={errors.telefono?.message}>
          {(a11y) => <Input {...a11y} type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" {...register("telefono")} />}
        </FormField>
        <FormField
          label="CURP"
          required
          error={errors.curp?.message}
          hint="Tal como aparece en tu documento oficial. Se guarda cifrada."
          className="sm:col-span-2"
        >
          {(a11y) => <Input {...a11y} maxLength={18} autoComplete="off" className="uppercase" {...register("curp")} />}
        </FormField>
        <FormField label="Descripción del problema" error={errors.descripcionProblema?.message} className="sm:col-span-2">
          {(a11y) => <Textarea {...a11y} rows={3} {...register("descripcionProblema")} />}
        </FormField>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={enviado && !isDirty}
          icon={<Save className="h-4 w-4" aria-hidden="true" />}
        >
          {enviado ? "Guardar cambios" : "Enviar datos"}
        </Button>
      </div>
    </form>
  );
}
