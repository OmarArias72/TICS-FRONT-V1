"use client";

import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, type VarianteBoton } from "./Button";
import { FormField, Textarea } from "./Form";
import { Modal } from "./Modal";

const motivoSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(5, "Escribe al menos 5 caracteres")
    .max(500, "Máximo 500 caracteres"),
});
type MotivoValues = z.infer<typeof motivoSchema>;

export interface MotivoModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  etiquetaBoton: string;
  icono: ReactNode;
  enviando: boolean;
  onEnviar: (texto: string) => void;
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

/**
 * Modal con un solo campo de texto obligatorio: motivo de rechazo o
 * cancelación, mensaje o respuesta.
 */
export function MotivoModal({ open, onClose, claveForm, title, description, ...props }: MotivoModalProps) {
  return (
    <Modal open={open} onClose={props.enviando ? () => {} : onClose} size="sm" title={title} description={description}>
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
