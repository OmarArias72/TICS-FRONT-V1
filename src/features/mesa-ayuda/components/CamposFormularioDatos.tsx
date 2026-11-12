"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { FormField, Input, Textarea } from "@/components/ui";

import type { FormularioValues } from "../utils/schemas";

interface CamposFormularioDatosProps {
  register: UseFormRegister<FormularioValues>;
  errors: FieldErrors<FormularioValues>;
  /** Texto de ayuda de la CURP (si ya se registró, hay que escribirla otra vez). */
  hintCurp: string;
  /** Ayuda del correo alterno; cambia en el formulario externo. */
  hintCorreoAlterno?: string;
}

/**
 * Campos del formulario de datos para el ticket de ServiceDesk. Los usan el
 * solicitante con cuenta (DetalleSolicitudModal) y la persona sin cuenta que
 * llega por el enlace del correo (FormularioExternoPage).
 */
export function CamposFormularioDatos({ register, errors, hintCurp, hintCorreoAlterno }: CamposFormularioDatosProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Nombre completo" required error={errors.nombreCompleto?.message} className="sm:col-span-2">
        {(a11y) => <Input {...a11y} autoComplete="name" {...register("nombreCompleto")} />}
      </FormField>
      <FormField label="Correo institucional" required error={errors.correoInstitucional?.message}>
        {(a11y) => (
          <Input {...a11y} type="email" autoComplete="email" placeholder="usuario@uaemex.mx" {...register("correoInstitucional")} />
        )}
      </FormField>
      <FormField
        label="Correo alterno"
        required
        error={errors.correoAlterno?.message}
        hint={hintCorreoAlterno ?? "Para contactarte si no puedes entrar a tu correo institucional."}
      >
        {(a11y) => <Input {...a11y} type="email" {...register("correoAlterno")} />}
      </FormField>
      <FormField label="Número de cuenta" required error={errors.numeroCuenta?.message}>
        {(a11y) => <Input {...a11y} inputMode="numeric" maxLength={7} {...register("numeroCuenta")} />}
      </FormField>
      <FormField label="Teléfono" required error={errors.telefono?.message}>
        {(a11y) => <Input {...a11y} type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" {...register("telefono")} />}
      </FormField>
      <FormField label="CURP" required error={errors.curp?.message} hint={hintCurp} className="sm:col-span-2">
        {(a11y) => <Input {...a11y} maxLength={18} autoComplete="off" className="uppercase" {...register("curp")} />}
      </FormField>
      <FormField label="Descripción del problema" required error={errors.descripcionProblema?.message} className="sm:col-span-2">
        {(a11y) => <Textarea {...a11y} rows={3} {...register("descripcionProblema")} />}
      </FormField>
    </div>
  );
}
