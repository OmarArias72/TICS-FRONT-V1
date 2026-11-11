"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/ui";
import { cn } from "@/lib/cn";

/**
 * Campo para el código de 6 dígitos que llega por correo. Acepta que el
 * usuario pegue "123 456" (quita todo lo que no sea número) y sugiere el
 * autocompletado de códigos de un solo uso en el celular.
 */
export function CodigoInput({
  value,
  onCambio,
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "value" | "onChange"> & { value: string; onCambio: (codigo: string) => void }) {
  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => onCambio(e.target.value.replace(/\D/g, "").slice(0, 6))}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={7}
      placeholder="000000"
      className={cn("text-center font-mono text-2xl tracking-[0.5em]", className)}
    />
  );
}

/** Normaliza el correo como lo hace el backend. */
export const normalizarCorreo = (correo: string) => correo.trim().toLowerCase();
