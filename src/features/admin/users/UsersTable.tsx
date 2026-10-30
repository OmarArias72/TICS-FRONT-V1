"use client";

import { Pencil, Trash2 } from "lucide-react";

import { IconButton, StatusBadge, TD, TH, THead, TR, Table, TableMessage } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Tono } from "@/lib/estados";
import type { NombreRol, Usuario } from "@/types/api";

const TONO_ROL: Record<NombreRol, Tono> = {
  Admin: "dorado",
  "Operador-tics": "info",
  Profesor: "ok",
  Estudiante: "neutro",
};

interface UsersTableProps {
  usuarios: Usuario[];
  cargando: boolean;
  error: string | null;
  idUsuarioActual: number | undefined;
  /** id del usuario cuyo estado se está cambiando (para deshabilitar su interruptor). */
  idCambiandoEstado: number | null;
  onEditar: (usuario: Usuario) => void;
  onEliminar: (usuario: Usuario) => void;
  onCambiarEstado: (usuario: Usuario) => void;
}

const MOTIVO_PROPIO = "No puedes desactivar ni eliminar tu propia cuenta";

export function UsersTable({
  usuarios,
  cargando,
  error,
  idUsuarioActual,
  idCambiandoEstado,
  onEditar,
  onEliminar,
  onCambiarEstado,
}: UsersTableProps) {
  return (
    <Table minWidth={820}>
      <THead>
        <tr>
          <TH>Nombre completo</TH>
          <TH>Correo</TH>
          <TH>Rol</TH>
          <TH>Estado</TH>
          <TH className="text-right">Acciones</TH>
        </tr>
      </THead>
      <tbody>
        {cargando ? (
          <TableMessage colSpan={5} loading>
            Cargando usuarios...
          </TableMessage>
        ) : error ? (
          <TableMessage colSpan={5} tone="error">
            {error}
          </TableMessage>
        ) : usuarios.length === 0 ? (
          <TableMessage colSpan={5}>No se encontraron usuarios con esos criterios.</TableMessage>
        ) : (
          usuarios.map((u) => {
            const esPropio = u.idUsuario === idUsuarioActual;
            const nombre = `${u.nombre} ${u.apellidos ?? ""}`.trim();
            const cambiando = idCambiandoEstado === u.idUsuario;
            return (
              <TR key={u.idUsuario} className={cn(!u.activo && "bg-superficie")}>
                <TD>
                  <div className="flex items-center gap-2 font-bold">
                    {nombre}
                    {esPropio && (
                      <span className="rounded-full bg-verde-oscuro px-2 py-0.5 text-[10px] font-bold uppercase text-superficie">
                        Tú
                      </span>
                    )}
                  </div>
                </TD>
                <TD className="text-sobre-variante">{u.correo}</TD>
                <TD>
                  <StatusBadge tono={TONO_ROL[u.nombreRol] ?? "neutro"} etiqueta={u.nombreRol} />
                </TD>
                <TD>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={u.activo}
                      aria-label={`Cuenta de ${nombre} ${u.activo ? "activa" : "inactiva"}`}
                      title={esPropio ? MOTIVO_PROPIO : u.activo ? "Desactivar cuenta" : "Activar cuenta"}
                      disabled={esPropio || cambiando}
                      onClick={() => onCambiarEstado(u)}
                      className={cn(
                        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado focus-visible:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        u.activo ? "bg-verde" : "bg-outline/50",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                          u.activo ? "translate-x-6" : "translate-x-1",
                        )}
                      />
                    </button>
                    <StatusBadge
                      tono={u.activo ? "ok" : "neutro"}
                      etiqueta={u.activo ? "Activo" : "Inactivo"}
                    />
                  </div>
                </TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <IconButton
                      label={`Editar a ${nombre}`}
                      size="sm"
                      icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => onEditar(u)}
                    />
                    <IconButton
                      label={esPropio ? MOTIVO_PROPIO : `Eliminar a ${nombre}`}
                      size="sm"
                      tone="danger"
                      disabled={esPropio}
                      icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => onEliminar(u)}
                    />
                  </div>
                </TD>
              </TR>
            );
          })
        )}
      </tbody>
    </Table>
  );
}
