import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/cn";

export type VarianteBoton = "primary" | "secondary" | "accent" | "danger" | "danger-outline" | "ghost";
export type TamanoBoton = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const variantes: Record<VarianteBoton, string> = {
  primary: "bg-verde text-white hover:bg-verde-hover",
  secondary: "border border-outline bg-white text-sobre-variante hover:bg-variante",
  accent: "bg-dorado text-dorado-oscuro hover:bg-dorado-claro",
  danger: "bg-error text-white hover:bg-error-oscuro",
  "danger-outline": "border border-error bg-white text-error hover:bg-error-claro",
  ghost: "text-sobre-variante hover:bg-variante",
};

// Alturas mínimas de 44 px (md) para cumplir el área táctil del prototipo.
const tamanos: Record<TamanoBoton, string> = {
  md: "h-11 px-4 text-sm",
  sm: "h-9 px-3 text-[13px]",
};

/** Clases de un botón; útil para estilizar otros elementos como botón. */
export function buttonClasses(
  variante: VarianteBoton = "primary",
  tamano: TamanoBoton = "md",
  className?: string,
): string {
  return cn(base, variantes[variante], tamanos[tamano], className);
}

interface PropsComunes {
  variant?: VarianteBoton;
  size?: TamanoBoton;
  /** Icono a la izquierda del texto (un icono de lucide-react). */
  icon?: ReactNode;
}

type ButtonProps = ComponentProps<"button"> &
  PropsComunes & {
    /** Muestra un indicador de carga y deshabilita el botón. */
    loading?: boolean;
  };

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & PropsComunes;

/** Enlace con aspecto de botón (navegación interna con next/link). */
export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}
