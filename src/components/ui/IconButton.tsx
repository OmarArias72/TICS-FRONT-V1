import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  /** Texto para lectores de pantalla; obligatorio porque el botón no tiene texto visible. */
  label: string;
  icon: ReactNode;
  tone?: "default" | "danger";
  size?: "md" | "sm";
};

/** Botón cuadrado con solo un icono (editar, eliminar, cerrar). */
export function IconButton({
  label,
  icon,
  tone = "default",
  size = "md",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border bg-white transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-11 w-11" : "h-9 w-9",
        tone === "danger"
          ? "border-error-claro text-error hover:bg-error-claro"
          : "border-variante text-verde hover:bg-verde-claro/40",
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
