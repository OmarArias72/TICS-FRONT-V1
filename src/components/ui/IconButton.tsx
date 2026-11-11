import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/cn";

const claseIcono = (size: "md" | "sm", tone: "default" | "danger", className?: string) =>
  cn(
    "inline-flex shrink-0 items-center justify-center rounded-xl border bg-white transition-colors",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    size === "md" ? "h-11 w-11" : "h-9 w-9",
    tone === "danger"
      ? "border-error-claro text-error hover:bg-error-claro"
      : "border-variante text-verde hover:bg-verde-claro/40",
    className,
  );

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
      className={claseIcono(size, tone, className)}
      {...props}
    >
      {icon}
    </button>
  );
}

/** Enlace interno con el mismo aspecto que IconButton (por ejemplo, "Historial"). */
export function IconLink({
  label,
  icon,
  size = "md",
  className,
  ...props
}: Omit<ComponentProps<typeof Link>, "children"> & { label: string; icon: ReactNode; size?: "md" | "sm" }) {
  return (
    <Link aria-label={label} title={label} className={claseIcono(size, "default", className)} {...props}>
      {icon}
    </Link>
  );
}
