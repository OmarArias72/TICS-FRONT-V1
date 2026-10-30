"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import { Button, FormField, Input, Modal } from "@/components/ui";
import { inventoryService } from "@/lib/api/services";
import { descargarArchivo, hoyISO } from "@/lib/download";

import { reporteSchema, type ReporteFormValues } from "./schemas";

const ID_FORMULARIO = "form-reporte";
const VALORES_INICIALES: ReporteFormValues = {
  fechaInicio: "",
  fechaFin: "",
  articulo: "",
  formato: "pdf",
};

/**
 * Descarga del reporte de equipos (PDF o CSV). Reemplaza a la barra fija de
 * filtros de reporte del original (decisión 2026-10-30).
 *
 * El backend filtra por fecha de registro y por artículo; sin fechas usa
 * desde el año 2000 hasta hoy.
 */
export function ReporteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [descargando, setDescargando] = useState(false);

  return (
    <Modal
      open={open}
      onClose={descargando ? () => {} : onClose}
      size="sm"
      title="Descargar reporte de equipos"
      description="Deja los campos vacíos para incluir todo el inventario."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={descargando}>
            Cancelar
          </Button>
          <Button type="submit" form={ID_FORMULARIO} variant="accent" loading={descargando}>
            Descargar
          </Button>
        </>
      }
    >
      {open && (
        <ReporteForm
          onDescargando={setDescargando}
          onListo={onClose}
        />
      )}
    </Modal>
  );
}

function ReporteForm({
  onDescargando,
  onListo,
}: {
  onDescargando: (v: boolean) => void;
  onListo: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReporteFormValues>({
    resolver: zodResolver(reporteSchema),
    defaultValues: VALORES_INICIALES,
  });

  const descargar = async ({ fechaInicio, fechaFin, articulo, formato }: ReporteFormValues) => {
    onDescargando(true);
    try {
      const filtroArticulo = articulo.trim() || undefined;
      const blob =
        formato === "pdf"
          ? await inventoryService.descargarReportePdf(fechaInicio || undefined, fechaFin || undefined, filtroArticulo)
          : await inventoryService.descargarReporteCsv(fechaInicio || undefined, fechaFin || undefined, filtroArticulo);
      descargarArchivo(blob, `reporte_equipos_${hoyISO()}.${formato}`);
      toast.success(`Reporte ${formato.toUpperCase()} descargado`);
      onListo();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al descargar el reporte");
    } finally {
      onDescargando(false);
    }
  };

  return (
    <form id={ID_FORMULARIO} noValidate onSubmit={handleSubmit(descargar)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Registrados desde" error={errors.fechaInicio?.message}>
          {(a11y) => <Input {...a11y} type="date" max={hoyISO()} {...register("fechaInicio")} />}
        </FormField>
        <FormField label="Registrados hasta" error={errors.fechaFin?.message}>
          {(a11y) => <Input {...a11y} type="date" max={hoyISO()} {...register("fechaFin")} />}
        </FormField>
      </div>
      <FormField label="Artículo" hint="Por ejemplo: LAPTOP" error={errors.articulo?.message}>
        {(a11y) => <Input {...a11y} autoComplete="off" {...register("articulo")} />}
      </FormField>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-sobre-variante">
          Formato
        </legend>
        <div className="flex gap-3">
          {(["pdf", "csv"] as const).map((formato) => (
            <label
              key={formato}
              className="flex h-11 flex-1 cursor-pointer items-center gap-2.5 rounded-xl border border-outline px-3 text-sm font-semibold has-checked:border-verde has-checked:bg-verde-claro/40"
            >
              <input type="radio" value={formato} className="h-4 w-4 accent-verde" {...register("formato")} />
              {formato.toUpperCase()}
            </label>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
