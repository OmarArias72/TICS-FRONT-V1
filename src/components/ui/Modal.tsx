"use client";

import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";

import { IconButton } from "./IconButton";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  /** Botones al pie del modal (Cancelar, Guardar...). */
  footer?: ReactNode;
  children?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Icono decorativo junto al título (por ejemplo, en confirmaciones). */
  icon?: ReactNode;
}

const anchos = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" } as const;

/**
 * Modal basado en el elemento nativo <dialog>: el navegador se encarga de
 * atrapar el foco, cerrar con Escape y bloquear el resto de la página.
 *
 * Con Cache Components, al navegar la página anterior se oculta en lugar de
 * desmontarse. Un <dialog> abierto en una página oculta seguiría bloqueando
 * la página visible, así que la limpieza del efecto lo cierra al ocultarse.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  size = "md",
  icon,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Escape o cerrar desde el código disparan "close": se avisa al padre.
      onClose={() => onCloseRef.current()}
      // Clic en el fondo (fuera del contenido) cierra el modal.
      onClick={(e) => {
        if (e.target === e.currentTarget) onCloseRef.current();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 text-sobre-superficie shadow-2xl",
        "backdrop:bg-verde-oscuro/60 backdrop:backdrop-blur-sm",
        anchos[size],
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start gap-3.5 px-6 pb-4 pt-5">
            {icon}
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-extrabold">
                {title}
              </h2>
              {description && (
                <div id={descriptionId} className="mt-1 text-sm leading-relaxed text-sobre-variante">
                  {description}
                </div>
              )}
            </div>
            <IconButton
              label="Cerrar"
              size="sm"
              icon={<X className="h-4 w-4" aria-hidden="true" />}
              onClick={() => onCloseRef.current()}
              className="border-transparent text-sobre-variante"
            />
          </div>
          {children && <div className="overflow-y-auto px-6 pb-5">{children}</div>}
          {footer && (
            <div className="flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">{footer}</div>
          )}
        </div>
      )}
    </dialog>
  );
}
