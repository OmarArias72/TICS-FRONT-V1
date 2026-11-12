"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MailSearch } from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";

import { Alert, Button, FormField, Input, Modal, StatusBadge, Textarea } from "@/components/ui";
import { eventoCorreo } from "@/lib/estados";
import { solicitudTecnicaService } from "@/lib/api/services";
import type { ResultadoProcesarCorreo } from "@/types/api";

import { clavesMesaAyuda } from "../utils/claves";

const esquema = z.object({
  asunto: z.string().trim().min(1, "Pega el asunto del correo").max(1000, "Máximo 1000 caracteres"),
  cuerpo: z.string().max(20000, "Máximo 20000 caracteres"),
});
type Valores = z.infer<typeof esquema>;

interface ProcesarCorreoModalProps {
  open: boolean;
  onClose: () => void;
  /** Abre la solicitud a la que se asoció el correo. */
  onAbrirSolicitud: (idSolicitud: number) => void;
}

/**
 * Registrar a mano un correo de la plataforma de tickets (backend v4): el
 * backend busca el ID del ticket en el asunto o el cuerpo y lo agrega como
 * seguimiento de la solicitud correspondiente.
 */
export function ProcesarCorreoModal({ open, onClose, onAbrirSolicitud }: ProcesarCorreoModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Procesar correo de la plataforma"
      description="Pega un correo de ServiceDesk (creado, actualizado, resuelto o cerrado). Se aplica igual que los que lee el buzón: asocia el ticket, registra el seguimiento o cierra la solicitud."
    >
      {open && <Formulario onClose={onClose} onAbrirSolicitud={onAbrirSolicitud} />}
    </Modal>
  );
}

function Formulario({ onClose, onAbrirSolicitud }: Omit<ProcesarCorreoModalProps, "open">) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Valores>({ resolver: zodResolver(esquema), defaultValues: { asunto: "", cuerpo: "" } });

  const mutation = useMutation({
    mutationFn: (v: Valores) => solicitudTecnicaService.procesarCorreo({ asunto: v.asunto, cuerpo: v.cuerpo || null }),
    onSuccess: (r) => {
      void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.buzon() });
      void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.estadoBuzon });
      if (r.procesado) void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.panel });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
      <FormField label="Asunto" required error={errors.asunto?.message}>
        {(a11y) => <Input {...a11y} autoComplete="off" placeholder="Su Ticket con el ID :##RE-83271## fue resuelto, favor de validarlo" {...register("asunto")} />}
      </FormField>
      <FormField label="Cuerpo del correo" error={errors.cuerpo?.message} hint="Opcional. Con el cuerpo se detecta el título del ticket y el texto de la resolución.">
        {(a11y) => <Textarea {...a11y} rows={6} {...register("cuerpo")} />}
      </FormField>

      {mutation.data && <Resultado r={mutation.data} onAbrir={onAbrirSolicitud} onClose={onClose} />}

      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
          Cerrar
        </Button>
        <Button type="submit" loading={mutation.isPending} icon={<MailSearch className="h-4 w-4" aria-hidden="true" />}>
          Procesar
        </Button>
      </div>
    </form>
  );
}

function Resultado({
  r,
  onAbrir,
  onClose,
}: {
  r: ResultadoProcesarCorreo;
  onAbrir: (id: number) => void;
  onClose: () => void;
}) {
  const tono = r.resultado === "REGISTRADO" ? "ok" : r.resultado === "DUPLICADO" ? "neutro" : "alerta";
  return (
    <Alert
      tone={tono}
      title={r.codigoTicket ? `Ticket ${r.codigoTicket}${r.tituloTicket ? ` · ${r.tituloTicket}` : ""}` : "No se encontró el ID del ticket"}
      action={
        r.idSolicitud !== null && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              onAbrir(r.idSolicitud!);
              onClose();
            }}
          >
            Abrir solicitud #{r.idSolicitud}
          </Button>
        )
      }
    >
      {r.evento && <StatusBadge {...eventoCorreo(r.evento)} className="mb-1.5 mr-2" />}
      {r.mensaje}
    </Alert>
  );
}
