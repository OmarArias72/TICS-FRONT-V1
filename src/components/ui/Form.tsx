"use client";

import { useId, type ComponentProps, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Campos de formulario del prototipo. Aceptan `ref` como prop (React 19),
 * así que funcionan con react-hook-form: <Input {...register("correo")} />.
 */

const control =
  "w-full rounded-xl border bg-white px-3 text-sm text-sobre-superficie outline-none transition-all " +
  "placeholder:text-sobre-variante/70 focus:border-verde focus:ring-2 focus:ring-verde/20 " +
  "disabled:cursor-not-allowed disabled:bg-superficie aria-[invalid=true]:border-2 " +
  "aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error/20";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.06em] text-sobre-variante",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-11 border-outline", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, "h-11 border-outline", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(control, "min-h-24 border-outline py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}

interface FormFieldProps {
  label: string;
  /** Mensaje de error de validación; marca el campo como inválido. */
  error?: string;
  /** Texto de ayuda debajo del campo. */
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  /**
   * Función que recibe los atributos de accesibilidad (id, aria-invalid,
   * aria-describedby) y devuelve el control. Así la etiqueta y los mensajes
   * quedan enlazados sin repetir ids a mano.
   */
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
    required?: boolean;
  }) => ReactElement;
}

/** Etiqueta + control + ayuda + error, enlazados para lectores de pantalla. */
export function FormField({ label, error, hint, required, className, children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="ml-0.5 text-error" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy || undefined,
        required,
      })}
      {hint && !error && (
        <p id={hintId} className="text-[13px] text-sobre-variante">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[13px] font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}
