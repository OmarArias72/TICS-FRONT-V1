"use client";

import type { ReactNode } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/cn";

import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" para acciones destructivas (eliminar, cancelar, dar de baja). */
  tone?: "danger" | "default";
  /** Mientras se ejecuta la acción: deshabilita botones y muestra carga. */
  loading?: boolean;
  children?: ReactNode;
}

/**
 * Confirmación de acciones. Reemplaza a window.confirm del proyecto original,
 * que no se podía estilizar ni leer bien con lectores de pantalla.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger",
  loading = false,
  children,
}: ConfirmDialogProps) {
  const peligro = tone === "danger";

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      size="sm"
      title={title}
      description={description}
      icon={
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            peligro ? "bg-error-claro text-error" : "bg-verde-claro text-verde",
          )}
        >
          {peligro ? (
            <TriangleAlert className="h-5 w-5" aria-hidden="true" />
          ) : (
            <CircleCheck className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={peligro ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
