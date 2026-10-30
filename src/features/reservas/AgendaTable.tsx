"use client";

import type { ReactNode } from "react";

import { StatusBadge, TD, TH, THead, TR, Table, TableMessage } from "@/components/ui";
import { cn } from "@/lib/cn";
import { estadoUsoSala } from "@/lib/estados";
import type { UsoSala } from "@/types/api";

interface AgendaTableProps {
  agenda: UsoSala[];
  cargando: boolean;
  error: string | null;
  /** Mensaje cuando no hay reservas ese día. */
  vacio?: string;
  /** Botones por fila (solo en Control de Reservas). */
  acciones?: (uso: UsoSala) => ReactNode;
}

/** Agenda de una sala en un día, ordenada por hora. */
export function AgendaTable({ agenda, cargando, error, vacio, acciones }: AgendaTableProps) {
  const columnas = acciones ? 5 : 4;
  const ordenada = [...agenda].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  return (
    <Table minWidth={acciones ? 780 : 520}>
      <THead>
        <tr>
          <TH>Horario</TH>
          <TH>Responsable</TH>
          <TH>Propósito</TH>
          <TH>Estado</TH>
          {acciones && <TH className="text-right">Acciones</TH>}
        </tr>
      </THead>
      <tbody>
        {cargando ? (
          <TableMessage colSpan={columnas} loading>
            Cargando agenda...
          </TableMessage>
        ) : error ? (
          <TableMessage colSpan={columnas} tone="error">
            {error}
          </TableMessage>
        ) : ordenada.length === 0 ? (
          <TableMessage colSpan={columnas}>
            {vacio ?? "No hay reservas registradas para esta fecha. Todos los horarios están libres."}
          </TableMessage>
        ) : (
          ordenada.map((uso) => {
            const cancelada = uso.estado === "Cancelada";
            return (
              <TR key={uso.idUso} className={cn(cancelada && "bg-superficie text-sobre-variante")}>
                <TD className={cn("whitespace-nowrap font-extrabold", cancelada && "line-through")}>
                  {uso.horaInicio} – {uso.horaFin}
                </TD>
                <TD>{uso.profesor}</TD>
                <TD className="text-sobre-variante">{uso.proposito || "—"}</TD>
                <TD>
                  <StatusBadge {...estadoUsoSala(uso.estado)} />
                </TD>
                {acciones && (
                  <TD>
                    <div className="flex justify-end gap-2">{!cancelada && acciones(uso)}</div>
                  </TD>
                )}
              </TR>
            );
          })
        )}
      </tbody>
    </Table>
  );
}
