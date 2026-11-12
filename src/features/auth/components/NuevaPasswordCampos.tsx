"use client";

import { FormField, Input, PasswordChecklist } from "@/components/ui";
import { validarPassword } from "@/lib/validation/password";

/** Nueva contraseña + confirmación con la lista de requisitos (mismas reglas que el backend). */
export function NuevaPasswordCampos({
  password,
  confirmar,
  onPassword,
  onConfirmar,
  error,
}: {
  password: string;
  confirmar: string;
  onPassword: (v: string) => void;
  onConfirmar: (v: string) => void;
  error?: string | null;
}) {
  const noCoinciden = confirmar !== "" && confirmar !== password;
  return (
    <>
      <FormField label="Nueva contraseña" required error={error ?? undefined}>
        {(a11y) => (
          <Input {...a11y} type="password" autoComplete="new-password" value={password} onChange={(e) => onPassword(e.target.value)} />
        )}
      </FormField>
      <FormField label="Confirmar contraseña" required error={noCoinciden ? "Las contraseñas no coinciden" : undefined}>
        {(a11y) => (
          <Input {...a11y} type="password" autoComplete="new-password" value={confirmar} onChange={(e) => onConfirmar(e.target.value)} />
        )}
      </FormField>
      <PasswordChecklist value={password} />
    </>
  );
}

/** true si la contraseña cumple las reglas y coincide con la confirmación. */
export const passwordLista = (password: string, confirmar: string) =>
  validarPassword(password) === null && password === confirmar;
