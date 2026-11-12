"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MailPlus } from "lucide-react";
import { toast } from "react-hot-toast";

import { Alert, Button, FormField, Input, Modal, Select, Textarea } from "@/components/ui";
import { ApiError, esCodigo } from "@/lib/api/errors";
import { solicitudTecnicaService } from "@/lib/api/services";
import type { SolicitudTecnica } from "@/types/api";

import { clavesMesaAyuda } from "../utils/claves";
import { HORAS_ENLACE_EXTERNO } from "../utils/flujo";
import { solicitudExternaSchema, type SolicitudExternaValues } from "../utils/schemas";

interface CrearSolicitudExternaModalProps {
  open: boolean;
  onClose: () => void;
  /** Al crearla, el panel la selecciona. */
  onCreada: (s: SolicitudTecnica) => void;
}

/**
 * "Solicitud externa" del Panel Mesa de Ayuda: para quien no puede entrar a su
 * correo institucional (y por eso no tiene o no puede usar su cuenta). TIC
 * captura los datos básicos y el sistema le envía a su correo alterno un enlace
 * para llenar el formulario sin iniciar sesión.
 */
export function CrearSolicitudExternaModal({ open, onClose, onCreada }: CrearSolicitudExternaModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva solicitud externa"
      description="Para alguien que no tiene acceso a su correo institucional."
    >
      {open && <Formulario onClose={onClose} onCreada={onCreada} />}
    </Modal>
  );
}

function Formulario({ onClose, onCreada }: Omit<CrearSolicitudExternaModalProps, "open">) {
  const queryClient = useQueryClient();
  const tiposQuery = useQuery({ queryKey: clavesMesaAyuda.tipos, queryFn: solicitudTecnicaService.obtenerTipos });
  const tipos = tiposQuery.data ?? [];

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SolicitudExternaValues>({
    resolver: zodResolver(solicitudExternaSchema),
    defaultValues: { nombre: "", correoAlterno: "", idTipo: "", motivo: "" },
  });

  const mutation = useMutation({
    mutationFn: (v: SolicitudExternaValues) =>
      solicitudTecnicaService.crearExterna({ ...v, idTipo: Number(v.idTipo) }),
    onSuccess: (s) => {
      void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.panel });
      toast.success(`Solicitud #${s.idSolicitud} abierta; enviamos el enlace a ${s.correoUsuario}`, { duration: 6000 });
      onCreada(s);
      onClose();
    },
    onError: (err: Error) => {
      if (esCodigo(err, "CORREO_INSTITUCIONAL")) {
        setError("correoAlterno", { message: err.message });
        return;
      }
      if (err instanceof ApiError) {
        for (const [campo, mensaje] of Object.entries(err.detalles)) {
          if (campo === "nombre" || campo === "correoAlterno" || campo === "idTipo" || campo === "motivo") {
            setError(campo, { message: mensaje });
          }
        }
      }
      toast.error(err.message);
    },
  });

  return (
    <form noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
      {tiposQuery.isError && <Alert tone="error">{tiposQuery.error.message}</Alert>}

      <FormField label="Nombre de la persona" required error={errors.nombre?.message}>
        {(a11y) => <Input {...a11y} autoComplete="off" autoFocus {...register("nombre")} />}
      </FormField>
      <FormField
        label="Correo alterno"
        required
        error={errors.correoAlterno?.message}
        hint="Gmail, Outlook u otro al que sí tenga acceso. Ahí llegan el enlace y el aviso final."
      >
        {(a11y) => <Input {...a11y} type="email" autoComplete="off" placeholder="nombre@gmail.com" {...register("correoAlterno")} />}
      </FormField>
      <FormField label="Tipo de solicitud" required error={errors.idTipo?.message}>
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
        label="Motivo"
        required
        error={errors.motivo?.message}
        hint="Lo verá la persona en el correo y en el formulario."
      >
        {(a11y) => <Textarea {...a11y} rows={3} {...register("motivo")} />}
      </FormField>

      <Alert tone="info">
        La solicitud queda aprobada. La persona recibe un enlace para llenar sus datos sin iniciar sesión; si no lo hace
        en {HORAS_ENLACE_EXTERNO} horas, se rechaza sola (podrás reenviarle el enlace). No verá el seguimiento: solo
        recibirá un correo cuando se resuelva o se rechace.
      </Alert>

      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={tipos.length === 0}
          icon={<MailPlus className="h-4 w-4" aria-hidden="true" />}
        >
          Abrir y enviar enlace
        </Button>
      </div>
    </form>
  );
}
