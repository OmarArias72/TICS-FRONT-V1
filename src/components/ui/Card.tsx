import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Tarjeta blanca con borde suave, base de paneles y listas. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border border-variante bg-white", className)}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** id del título, para enlazarlo con aria-labelledby. */
  titleId?: string;
}

/** Cabecera de tarjeta con título, texto opcional y acciones a la derecha. */
export function CardHeader({ title, description, actions, titleId }: CardHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-variante px-6 py-5">
      <div>
        <h2 id={titleId} className="text-lg font-extrabold text-sobre-superficie">
          {title}
        </h2>
        {description && <p className="mt-1 text-[13px] text-sobre-variante">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-end gap-2.5">{actions}</div>}
    </div>
  );
}
