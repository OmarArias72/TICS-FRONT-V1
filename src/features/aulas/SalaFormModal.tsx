"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button, FormField, Input, Modal, Textarea } from "@/components/ui";
import { salaService } from "@/lib/api/services";
import type { Sala } from "@/types/api";

import { clavesAulas } from "./claves";
import { salaSchema, type SalaValues } from "./schemas";

interface SalaFormModalProps {
  open: boolean;
  /** null para registrar una sala nueva. */
  sala: Sala | null;
  onClose: () => void;
}

/** Registrar o editar una sala (antes RoomFormModal.jsx). Permiso: "salas.gestionar". */
export function SalaFormModal({ open, sala, onClose }: SalaFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={sala ? "Editar sala" : "Registrar sala"}>
      {open && <SalaForm key={sala?.idSala ?? "nueva"} sala={sala} onClose={onClose} />}
    </Modal>
  );
}

function SalaForm({ sala, onClose }: { sala: Sala | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [iniciales] = useState<SalaValues>(() => ({
    codigoSala: sala?.codigoSala ?? "",
    nombre: sala?.nombre ?? "",
    ubicacion: sala?.ubicacion ?? "",
    descripcion: sala?.descripcion ?? "",
  }));
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SalaValues>({ resolver: zodResolver(salaSchema), defaultValues: iniciales });

  const mutation = useMutation({
    mutationFn: (v: SalaValues) => {
      const datos = {
        codigoSala: v.codigoSala,
        nombre: v.nombre || null,
        ubicacion: v.ubicacion || null,
        descripcion: v.descripcion || null,
      };
      return sala ? salaService.actualizar(sala.idSala, datos) : salaService.crear(datos);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesAulas.salas });
      toast.success(sala ? "Sala actualizada" : "Sala registrada");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Código" required error={errors.codigoSala?.message} hint="Por ejemplo: CC-01. No se puede repetir.">
          {(a11y) => <Input {...a11y} autoComplete="off" {...register("codigoSala")} />}
        </FormField>
        <FormField label="Nombre" error={errors.nombre?.message}>
          {(a11y) => <Input {...a11y} placeholder="Centro de Cómputo 1" {...register("nombre")} />}
        </FormField>
        <FormField label="Ubicación" error={errors.ubicacion?.message} className="sm:col-span-2">
          {(a11y) => <Input {...a11y} placeholder="Edificio A, planta baja" {...register("ubicacion")} />}
        </FormField>
        <FormField label="Descripción" error={errors.descripcion?.message} className="sm:col-span-2">
          {(a11y) => <Textarea {...a11y} rows={3} {...register("descripcion")} />}
        </FormField>
      </div>
      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={sala !== null && !isDirty}
          icon={<Save className="h-4 w-4" aria-hidden="true" />}
        >
          {sala ? "Guardar cambios" : "Registrar sala"}
        </Button>
      </div>
    </form>
  );
}
