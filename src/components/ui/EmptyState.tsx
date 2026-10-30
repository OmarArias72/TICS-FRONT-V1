import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

/** Mensaje para listas sin resultados, con una acción opcional. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline/50 bg-white px-6 py-12 text-center">
      {icon && <div className="text-verde">{icon}</div>}
      <p className="text-base font-bold text-sobre-superficie">{title}</p>
      {description && <p className="max-w-md text-sm text-sobre-variante">{description}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
