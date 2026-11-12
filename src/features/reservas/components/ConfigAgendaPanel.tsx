"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CalendarX, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";

import { Alert, Button, Card, FormField, Input, PageLoader, StatusBadge, Textarea } from "@/components/ui";
import { clavesReservas } from "../utils/claves";
import { configuracionService } from "@/lib/api/services";
import { formatearDia, formatearFecha } from "@/lib/fechas";
import type { ConfiguracionModulo } from "@/types/api";

const esquema = z
  .object({
    habilitado: z.boolean(),
    fechaInicio: z.string(),
    fechaFin: z.string(),
    mensaje: z.string().trim().max(500, "Máximo 500 caracteres"),
  })
  .refine((v) => !v.fechaInicio || !v.fechaFin || v.fechaFin >= v.fechaInicio, {
    path: ["fechaFin"],
    message: "La fecha final debe ser igual o posterior a la inicial",
  });
type Valores = z.infer<typeof esquema>;

/**
 * Apertura y cierre del módulo de reservas (antes AdminConfigAgendaPage.jsx).
 *
 * Backend v4: se guarda en `PUT /api/configuracion/modulos/RESERVAS`. Con el
 * módulo cerrado, o fuera del periodo, el Profesor ve el mensaje y no puede
 * consultar la agenda ni reservar; Admin y Operador siguen trabajando.
 */
export function ConfigAgendaPanel() {
  const query = useQuery({
    queryKey: clavesReservas.modulo,
    queryFn: () => configuracionService.obtenerModulo("RESERVAS"),
  });

  if (query.isPending) return <PageLoader label="Cargando configuración..." />;
  if (query.isError) return <Alert tone="error">{query.error.message}</Alert>;

  // Se vuelve a montar el formulario cuando cambia la configuración guardada.
  return <Formulario key={query.data.fechaActualizacion ?? "inicial"} config={query.data} />;
}

function Formulario({ config }: { config: ConfiguracionModulo }) {
  const queryClient = useQueryClient();
  const [iniciales] = useState<Valores>(() => ({
    habilitado: config.habilitado,
    fechaInicio: config.fechaInicio ?? "",
    fechaFin: config.fechaFin ?? "",
    mensaje: config.mensaje ?? "",
  }));
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<Valores>({ resolver: zodResolver(esquema), defaultValues: iniciales });
  const habilitado = useWatch({ control, name: "habilitado" });

  const guardar = useMutation({
    mutationFn: (v: Valores) =>
      configuracionService.actualizarModulo("RESERVAS", {
        habilitado: v.habilitado,
        fechaInicio: v.fechaInicio || null,
        fechaFin: v.fechaFin || null,
        mensaje: v.mensaje || null,
      }),
    onSuccess: (nueva) => {
      queryClient.setQueryData(clavesReservas.modulo, nueva);
      toast.success(nueva.habilitado ? "Reservas habilitadas" : "Reservas deshabilitadas");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Card className="flex w-full max-w-xl flex-col gap-6 p-6 sm:p-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-dorado-texto">Administración TIC</span>
        <h1 className="mt-1 text-2xl font-extrabold text-sobre-superficie">Apertura / Cierre de agenda</h1>
        <p className="mt-1 text-sm text-sobre-variante">
          Habilita o cierra la reserva de salas para los profesores. Administración y Operador siguen
          trabajando con la agenda.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-superficie p-4">
        <div className="flex items-center gap-3">
          {config.disponible ? (
            <CalendarCheck className="h-6 w-6 text-verde" aria-hidden="true" />
          ) : (
            <CalendarX className="h-6 w-6 text-error" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm font-bold">Estado actual</p>
            <p className="text-[13px] text-sobre-variante">
              {config.actualizadoPor
                ? `Último cambio: ${config.actualizadoPor}, ${formatearFecha(config.fechaActualizacion)}`
                : "Sin cambios registrados"}
            </p>
          </div>
        </div>
        <StatusBadge
          tono={config.disponible ? "ok" : "error"}
          etiqueta={config.disponible ? "Disponible hoy" : config.habilitado ? "Fuera del periodo" : "Cerrada"}
        />
      </div>

      <form noValidate onSubmit={handleSubmit((v) => guardar.mutate(v))} className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-variante p-4">
          <div>
            <span id="estado-agenda" className="block text-sm font-bold">
              {habilitado ? "Reservas habilitadas" : "Reservas cerradas"}
            </span>
            <span className="text-xs text-sobre-variante">
              {habilitado ? "Los profesores pueden reservar en el periodo indicado." : "Los profesores no pueden reservar."}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={habilitado}
            aria-labelledby="estado-agenda"
            onClick={() => setValue("habilitado", !habilitado, { shouldDirty: true })}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado focus-visible:ring-offset-2 ${
              habilitado ? "bg-verde" : "bg-outline/50"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                habilitado ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Desde" error={errors.fechaInicio?.message} hint="Opcional. Vacío: desde hoy.">
            {(a11y) => <Input {...a11y} type="date" {...register("fechaInicio")} />}
          </FormField>
          <FormField label="Hasta" error={errors.fechaFin?.message} hint="Opcional. Vacío: sin fecha de cierre.">
            {(a11y) => <Input {...a11y} type="date" {...register("fechaFin")} />}
          </FormField>
        </div>

        <FormField
          label="Mensaje para los profesores"
          error={errors.mensaje?.message}
          hint="Se muestra en Reserva de Salas cuando el módulo no está disponible."
        >
          {(a11y) => <Textarea {...a11y} rows={3} {...register("mensaje")} />}
        </FormField>

        {config.fechaInicio && (
          <p className="text-[13px] text-sobre-variante">
            Periodo guardado: {formatearDia(config.fechaInicio)}
            {config.fechaFin ? ` al ${formatearDia(config.fechaFin)}` : " en adelante"}.
          </p>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={guardar.isPending}
            disabled={!isDirty}
            icon={<Save className="h-4 w-4" aria-hidden="true" />}
          >
            Guardar
          </Button>
        </div>
      </form>
    </Card>
  );
}
