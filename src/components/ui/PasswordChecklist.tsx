import { Check, Circle } from "lucide-react";

import { cn } from "@/lib/cn";
import { REGLAS_PASSWORD } from "@/lib/validation/password";

/** Lista de requisitos de contraseña que se marcan mientras el usuario escribe. */
export function PasswordChecklist({ value, id }: { value: string; id?: string }) {
  return (
    <ul id={id} aria-label="Requisitos de la contraseña" className="grid grid-cols-1 gap-1 sm:grid-cols-2">
      {REGLAS_PASSWORD.map((regla) => {
        const ok = regla.cumple(value);
        return (
          <li
            key={regla.id}
            className={cn(
              "flex items-center gap-1.5 text-[13px]",
              ok ? "font-semibold text-verde" : "text-sobre-variante",
            )}
          >
            {ok ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Circle className="h-3 w-3" aria-hidden="true" />
            )}
            {regla.texto}
            <span className="sr-only">{ok ? "(cumplido)" : "(pendiente)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
