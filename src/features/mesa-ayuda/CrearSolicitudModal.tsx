"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "react-hot-toast";

import { Alert, Button, FormField, Modal, Select, Textarea } from "@/components/ui";
import { solicitudTecnicaService } from "@/lib/api/services";

import { clavesMesaAyuda } from "./claves";
import { MAX_SOLICITUDES_ACTIVAS } from "./flujo";
import { crearSolicitudSchema, type CrearSolicitudValues } from "./schemas";

interface CrearSolicitudModalProps {
  open: boolean;
  onClose: () => void;
  idUsuario: number;
}

/** Nueva solicitud técnica (antes CrearSolicitudTecnicaModal.jsx). */
export function CrearSolicitudModal({ open, onClose, idUsuario }: CrearSolicitudModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva solicitud"
      description="Contraseña de correo, autenticador u otro problema con los servicios TIC."
    >
      {open && <CrearSolicitudForm idUsuario={idUsuario} onClose={onClose} />}
    </Modal>
  );
}

function CrearSolicitudForm({ idUsuario, onClose }: { idUsuario: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const tiposQuery = useQuery({ queryKey: clavesMesaAyuda.tipos, queryFn: solicitudTecnicaService.obtenerTipos });
  const tipos = tiposQuery.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<CrearSolicitudValues>({
    resolver: zodResolver(crearSolicitudSchema),
    defaultValues: { idTipo: "", motivo: "" },
  });
  const idTipo = useWatch({ control, name: "idTipo" });
  const tipo = tipos.find((t) => String(t.idTipo) === idTipo);
  const esOtro = tipo?.nombre === "OTRO";

  const mutation = useMutation({
    mutationFn: (v: CrearSolicitudValues) =>
      solicitudTecnicaService.crearSolicitud(idUsuario, { idTipo: Number(v.idTipo), motivo: v.motivo || null }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.misSolicitudes(idUsuario) });
      toast.success("Solicitud enviada; TICS la revisará");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const enviar = (v: CrearSolicitudValues) => {
    if (esOtro && v.motivo.length < 10) {
      setError("motivo", { message: "Describe el problema (al menos 10 caracteres)" });
      return;
    }
    mutation.mutate(v);
  };

  return (
    <form noValidate onSubmit={handleSubmit(enviar)} className="flex flex-col gap-4">
      {tiposQuery.isError && <Alert tone="error">{tiposQuery.error.message}</Alert>}

      <FormField label="¿Qué necesitas?" required error={errors.idTipo?.message}>
        {(a11y) => (
          <Select {...a11y} disabled={tiposQuery.isPending} {...register("idTipo")}>
            <option value="">{tiposQuery.isPending ? "Cargando..." : "Elige una opción"}</option>
            {tipos.map((t) => (
              <option key={t.idTipo} value={String(t.idTipo)}>
                {t.descripcion ?? t.nombre}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      <FormField
        label={esOtro ? "Describe el problema" : "Motivo o detalle (opcional)"}
        required={esOtro}
        error={errors.motivo?.message}
        hint={esOtro ? "Incluye qué servicio falla y desde cuándo." : "Por ejemplo: cambié de teléfono y perdí el acceso."}
      >
        {(a11y) => <Textarea {...a11y} rows={4} {...register("motivo")} />}
      </FormField>

      <Alert tone="info">
        Puedes tener hasta {MAX_SOLICITUDES_ACTIVAS} solicitudes activas y enviar una del mismo tipo cada 24 horas.
      </Alert>

      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={tipos.length === 0}
          icon={<Send className="h-4 w-4" aria-hidden="true" />}
        >
          Enviar solicitud
        </Button>
      </div>
    </form>
  );
}
