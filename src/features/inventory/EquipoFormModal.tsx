"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, Button, FormField, Input, Modal, Select, Textarea } from "@/components/ui";
import type { EquipoVista } from "@/types/api";

import { ESTADOS_EQUIPO, equipoSchema, type EquipoFormValues } from "./schemas";

const ID_FORMULARIO = "form-equipo";

interface EquipoFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Equipo a editar; `null` para registrar uno nuevo. */
  equipo: EquipoVista | null;
  /** Permiso "inventario.darDeBaja" (solo Admin). */
  puedeDarDeBaja: boolean;
  saving: boolean;
  onSubmit: (values: EquipoFormValues) => void;
}

/** Alta y edición de equipos del inventario. */
export function EquipoFormModal({
  open,
  onClose,
  equipo,
  puedeDarDeBaja,
  saving,
  onSubmit,
}: EquipoFormModalProps) {
  const editando = equipo !== null;

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      size="lg"
      title={editando ? `Editar equipo ${equipo.inventario}` : "Registrar nuevo equipo"}
      description={
        editando ? undefined : "Artículo, marca y modelo se crean automáticamente si no existen."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={ID_FORMULARIO} loading={saving}>
            {editando ? "Guardar cambios" : "Registrar equipo"}
          </Button>
        </>
      }
    >
      {/* Se crea de nuevo en cada apertura (key por equipo): sin sincronizar estado en efectos. */}
      {open && (
        <EquipoForm
          key={equipo?.inventario ?? "nuevo"}
          equipo={equipo}
          puedeDarDeBaja={puedeDarDeBaja}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function valoresIniciales(equipo: EquipoVista | null): EquipoFormValues {
  const estado = ESTADOS_EQUIPO.find((e) => e === equipo?.estado) ?? "ALTA";
  return {
    inventario: equipo?.inventario ?? "",
    serie: equipo?.serie ?? "",
    nombreArticulo: equipo?.nombreArticulo ?? "",
    // EquipoVistaDTO usa `marca` y `modelo`; el request espera `nombreMarca` y `nombreModelo`.
    nombreMarca: equipo?.marca ?? "",
    nombreModelo: equipo?.modelo ?? "",
    cantidad: equipo?.cantidad ?? 1,
    caracteristicas: equipo?.caracteristicas ?? "",
    estado,
  };
}

function EquipoForm({
  equipo,
  puedeDarDeBaja,
  onSubmit,
}: Pick<EquipoFormModalProps, "equipo" | "puedeDarDeBaja" | "onSubmit">) {
  const editando = equipo !== null;
  const [iniciales] = useState(() => valoresIniciales(equipo));

  // Regla 2026-10-30: el Operador no da de BAJA y, si el equipo ya está en
  // BAJA, puede corregir sus datos pero no cambiar el estado.
  const bloqueadoEnBaja = !puedeDarDeBaja && iniciales.estado === "BAJA";
  const estadosDisponibles = ESTADOS_EQUIPO.filter((e) => puedeDarDeBaja || e !== "BAJA");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EquipoFormValues>({
    resolver: zodResolver(equipoSchema),
    defaultValues: iniciales,
  });

  return (
    <form
      id={ID_FORMULARIO}
      noValidate
      onSubmit={handleSubmit((values) =>
        // Refuerzo: aunque se manipule el formulario, un equipo en BAJA conserva su estado.
        onSubmit(bloqueadoEnBaja ? { ...values, estado: "BAJA" } : values),
      )}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <FormField
        label="No. de inventario"
        required
        error={errors.inventario?.message}
        hint={editando ? "El número de inventario no se puede modificar." : undefined}
      >
        {(a11y) => (
          <Input {...a11y} autoComplete="off" readOnly={editando} {...register("inventario")} />
        )}
      </FormField>
      <FormField label="No. de serie" error={errors.serie?.message}>
        {(a11y) => <Input {...a11y} autoComplete="off" {...register("serie")} />}
      </FormField>

      <FormField label="Artículo" required error={errors.nombreArticulo?.message} hint="Por ejemplo: LAPTOP">
        {(a11y) => <Input {...a11y} autoComplete="off" {...register("nombreArticulo")} />}
      </FormField>
      <FormField label="Cantidad" required error={errors.cantidad?.message}>
        {(a11y) => (
          <Input
            {...a11y}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            {...register("cantidad", { valueAsNumber: true })}
          />
        )}
      </FormField>

      <FormField
        label="Marca"
        error={errors.nombreMarca?.message}
        hint={editando ? "Vacío conserva la marca actual." : "Vacío se registra como GENÉRICA."}
      >
        {(a11y) => <Input {...a11y} autoComplete="off" {...register("nombreMarca")} />}
      </FormField>
      <FormField
        label="Modelo"
        error={errors.nombreModelo?.message}
        hint={editando ? "Vacío conserva el modelo actual." : "Vacío se registra como GENÉRICO."}
      >
        {(a11y) => <Input {...a11y} autoComplete="off" {...register("nombreModelo")} />}
      </FormField>

      <FormField label="Estado" required error={errors.estado?.message}>
        {(a11y) =>
          bloqueadoEnBaja ? (
            <Select {...a11y} value="BAJA" disabled onChange={() => {}}>
              <option value="BAJA">BAJA</option>
            </Select>
          ) : (
            <Select {...a11y} {...register("estado")}>
              {estadosDisponibles.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          )
        }
      </FormField>

      {bloqueadoEnBaja && (
        <Alert tone="neutro" className="self-end">
          Este equipo está dado de BAJA. Puedes corregir sus datos; solo un administrador puede
          reactivarlo.
        </Alert>
      )}

      <FormField label="Características" error={errors.caracteristicas?.message} className="sm:col-span-2">
        {(a11y) => (
          <Textarea
            {...a11y}
            rows={3}
            placeholder="Procesador, memoria, almacenamiento..."
            {...register("caracteristicas")}
          />
        )}
      </FormField>
    </form>
  );
}
