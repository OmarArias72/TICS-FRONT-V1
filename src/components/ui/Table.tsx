import type { ComponentProps, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Piezas de tabla con el estilo del prototipo. La tabla va dentro de un
 * contenedor con desplazamiento horizontal para que no rompa el diseño en
 * pantallas angostas.
 */
export function Table({
  className,
  minWidth = 640,
  ...props
}: ComponentProps<"table"> & { minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table
        style={{ minWidth }}
        className={cn("w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function THead({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      className={cn(
        "bg-superficie text-left text-xs uppercase tracking-[0.05em] text-sobre-variante",
        className,
      )}
      {...props}
    />
  );
}

export function TH({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn("px-3 py-3 font-bold first:pl-6 last:pr-6", className)}
      {...props}
    />
  );
}

export function TR({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("border-t border-variante", className)} {...props} />;
}

export function TD({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-3 py-3.5 align-middle first:pl-6 last:pr-6", className)} {...props} />;
}

/** Fila que ocupa todas las columnas: carga, error o lista vacía. */
export function TableMessage({
  colSpan,
  children,
  loading = false,
  tone = "default",
}: {
  colSpan: number;
  children: ReactNode;
  loading?: boolean;
  tone?: "default" | "error";
}) {
  return (
    <tr className="border-t border-variante">
      <td
        colSpan={colSpan}
        className={cn(
          "px-6 py-12 text-center text-sm font-semibold",
          tone === "error" ? "text-error" : "text-sobre-variante",
        )}
      >
        <span className="inline-flex items-center gap-2" role={loading ? "status" : undefined}>
          {loading && <LoaderCircle className="h-4 w-4 animate-spin text-verde" aria-hidden="true" />}
          {children}
        </span>
      </td>
    </tr>
  );
}
