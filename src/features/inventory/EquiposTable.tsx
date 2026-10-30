"use client";

import { Pencil, Trash2 } from "lucide-react";

import { IconButton, StatusBadge, TD, TH, THead, TR, Table, TableMessage } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatearFecha } from "@/lib/download";
import { estadoEquipo } from "@/lib/estados";
import type { EquipoVista } from "@/types/api";

interface EquiposTableProps {
  equipos: EquipoVista[];
  cargando: boolean;
  error: string | null;
  seleccionados: ReadonlySet<string>;
  /** Indica si un equipo se puede seleccionar para el cambio masivo. */
  esSeleccionable: (equipo: EquipoVista) => boolean;
  onAlternarSeleccion: (inventario: string) => void;
  onSeleccionarTodos: (marcar: boolean) => void;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  onEditar: (equipo: EquipoVista) => void;
  onEliminar: (equipo: EquipoVista) => void;
}

const COLUMNAS = 7;

export function EquiposTable({
  equipos,
  cargando,
  error,
  seleccionados,
  esSeleccionable,
  onAlternarSeleccion,
  onSeleccionarTodos,
  puedeEditar,
  puedeEliminar,
  onEditar,
  onEliminar,
}: EquiposTableProps) {
  const seleccionables = equipos.filter(esSeleccionable);
  const todosMarcados =
    seleccionables.length > 0 && seleccionables.every((e) => seleccionados.has(e.inventario));

  return (
    <Table minWidth={900}>
      <THead>
        <tr>
          <TH className="w-12">
            <input
              type="checkbox"
              aria-label="Seleccionar todos los equipos visibles"
              className="h-[18px] w-[18px] accent-verde"
              checked={todosMarcados}
              disabled={seleccionables.length === 0}
              onChange={(e) => onSeleccionarTodos(e.target.checked)}
            />
          </TH>
          <TH>Inventario / Serie</TH>
          <TH>Artículo</TH>
          <TH>Marca / Modelo</TH>
          <TH className="text-center">Cant.</TH>
          <TH>Estado / Registro</TH>
          <TH className="text-right">Acciones</TH>
        </tr>
      </THead>
      <tbody>
        {cargando ? (
          <TableMessage colSpan={COLUMNAS} loading>
            Cargando inventario...
          </TableMessage>
        ) : error ? (
          <TableMessage colSpan={COLUMNAS} tone="error">
            {error}
          </TableMessage>
        ) : equipos.length === 0 ? (
          <TableMessage colSpan={COLUMNAS}>No se encontraron equipos con estos criterios.</TableMessage>
        ) : (
          equipos.map((e) => {
            const marcado = seleccionados.has(e.inventario);
            const seleccionable = esSeleccionable(e);
            return (
              <TR key={e.inventario} className={cn(marcado && "bg-verde-claro/20")}>
                <TD>
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${e.inventario}`}
                    title={seleccionable ? undefined : "Solo un administrador puede cambiar el estado de un equipo en BAJA"}
                    className="h-[18px] w-[18px] accent-verde disabled:cursor-not-allowed disabled:opacity-40"
                    checked={marcado}
                    disabled={!seleccionable}
                    onChange={() => onAlternarSeleccion(e.inventario)}
                  />
                </TD>
                <TD>
                  <div className="font-extrabold">{e.inventario}</div>
                  <div className="text-[13px] text-sobre-variante">{e.serie || "Sin serie"}</div>
                </TD>
                <TD>{e.nombreArticulo}</TD>
                <TD>
                  <div className="font-semibold">{e.marca}</div>
                  <div className="text-[13px] text-sobre-variante">{e.modelo}</div>
                </TD>
                <TD className="text-center">{e.cantidad ?? 1}</TD>
                <TD>
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge {...estadoEquipo(e.estado)} />
                    <span className="text-xs text-sobre-variante">{formatearFecha(e.fechaRegistro)}</span>
                  </div>
                </TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    {puedeEditar && (
                      <IconButton
                        label={`Editar ${e.inventario}`}
                        size="sm"
                        icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                        onClick={() => onEditar(e)}
                      />
                    )}
                    {puedeEliminar && (
                      <IconButton
                        label={`Eliminar ${e.inventario}`}
                        size="sm"
                        tone="danger"
                        icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                        onClick={() => onEliminar(e)}
                      />
                    )}
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
