"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { Card, Input, Label, PageContainer, TD, TH, THead, TR, Table, TableMessage } from "@/components/ui";
import { inventoryService } from "@/lib/api/services";
import { cn } from "@/lib/cn";
import type { AgrupacionConteo, ConteoInventario } from "@/types/api";

import { InventoryHeader } from "./InventoryHeader";

type FiltroEstado = "TODOS" | "ALTA" | "MANTENIMIENTO" | "BAJA";

const AGRUPACIONES: Array<{ valor: AgrupacionConteo; etiqueta: string }> = [
  { valor: "articulo", etiqueta: "Por artículo" },
  { valor: "modelo", etiqueta: "Por marca y modelo" },
];

const FILTROS: Array<{ valor: FiltroEstado; etiqueta: string }> = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "ALTA", etiqueta: "Con ALTA" },
  { valor: "MANTENIMIENTO", etiqueta: "Con mantenimiento" },
  { valor: "BAJA", etiqueta: "Con BAJA" },
];

const CUMPLE: Record<FiltroEstado, (r: ConteoInventario) => boolean> = {
  TODOS: () => true,
  ALTA: (r) => r.alta > 0,
  MANTENIMIENTO: (r) => r.mantenimiento > 0,
  BAJA: (r) => r.baja > 0,
};

/** Barra apilada con la proporción de equipos en cada estado. */
function Distribucion({ fila }: { fila: ConteoInventario }) {
  if (!fila.total) return <div className="h-2 w-full rounded-full bg-variante" />;
  const pct = (n: number) => `${(n / fila.total) * 100}%`;
  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-full bg-variante"
      role="img"
      aria-label={`${fila.alta} en ALTA, ${fila.mantenimiento} en mantenimiento, ${fila.baja} en BAJA`}
    >
      <span className="bg-verde" style={{ width: pct(fila.alta) }} />
      <span className="bg-alerta" style={{ width: pct(fila.mantenimiento) }} />
      <span className="bg-error" style={{ width: pct(fila.baja) }} />
    </div>
  );
}

function Segmentado<T extends string>({
  etiqueta,
  opciones,
  valor,
  onCambio,
}: {
  etiqueta: string;
  opciones: Array<{ valor: T; etiqueta: string }>;
  valor: T;
  onCambio: (v: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-sobre-variante">
        {etiqueta}
      </legend>
      <div className="flex flex-wrap gap-1 rounded-xl bg-variante/60 p-1">
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            aria-pressed={valor === o.valor}
            onClick={() => onCambio(o.valor)}
            className={cn(
              "h-9 rounded-lg px-3 text-sm font-semibold transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado",
              valor === o.valor ? "bg-white text-verde shadow-sm" : "text-sobre-variante hover:text-sobre-superficie",
            )}
          >
            {o.etiqueta}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Conteos del inventario (antes InventoryCountPage.jsx). */
export function ConteoPage() {
  const [agruparPor, setAgruparPor] = useState<AgrupacionConteo>("articulo");
  const [filtro, setFiltro] = useState<FiltroEstado>("TODOS");
  const [busqueda, setBusqueda] = useState("");

  const conteoQuery = useQuery({
    queryKey: ["conteo-inventario", agruparPor],
    queryFn: () =>
      agruparPor === "modelo" ? inventoryService.contarPorModelo() : inventoryService.contarPorArticulo(),
  });

  const filas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return (conteoQuery.data ?? []).filter(
      (r) => CUMPLE[filtro](r) && (!termino || r.categoria.toLowerCase().includes(termino)),
    );
  }, [conteoQuery.data, filtro, busqueda]);

  const totales = filas.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      alta: acc.alta + r.alta,
      mantenimiento: acc.mantenimiento + r.mantenimiento,
      baja: acc.baja + r.baja,
    }),
    { total: 0, alta: 0, mantenimiento: 0, baja: 0 },
  );

  return (
    <PageContainer>
      <InventoryHeader description="Totales del inventario por estado." />

      <Card className="flex flex-wrap items-end gap-4 p-4">
        <Segmentado
          etiqueta="Agrupar"
          opciones={AGRUPACIONES}
          valor={agruparPor}
          onCambio={(v) => {
            setAgruparPor(v);
            // Como en el original: al cambiar la agrupación se limpia la búsqueda.
            setBusqueda("");
          }}
        />
        <Segmentado etiqueta="Mostrar" opciones={FILTROS} valor={filtro} onCambio={setFiltro} />
        <div className="flex min-w-60 flex-1 flex-col gap-1.5">
          <Label htmlFor="buscar-conteo">Buscar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-sobre-variante" aria-hidden="true" />
            <Input
              id="buscar-conteo"
              type="search"
              placeholder={agruparPor === "modelo" ? "Marca o modelo" : "Nombre del artículo"}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table minWidth={720}>
          <THead>
            <tr>
              <TH>{agruparPor === "modelo" ? "Marca - Modelo" : "Artículo"}</TH>
              <TH className="text-center">Total</TH>
              <TH className="text-center">ALTA</TH>
              <TH className="text-center">Mantenimiento</TH>
              <TH className="text-center">BAJA</TH>
              <TH className="w-48">Distribución</TH>
            </tr>
          </THead>
          <tbody>
            {conteoQuery.isPending ? (
              <TableMessage colSpan={6} loading>
                Calculando conteos...
              </TableMessage>
            ) : conteoQuery.isError ? (
              <TableMessage colSpan={6} tone="error">
                {conteoQuery.error.message}
              </TableMessage>
            ) : filas.length === 0 ? (
              <TableMessage colSpan={6}>No hay resultados con estos filtros.</TableMessage>
            ) : (
              filas.map((r) => (
                <TR key={r.categoria}>
                  <TD className="font-bold">{r.categoria}</TD>
                  <TD className="text-center text-base font-extrabold">{r.total}</TD>
                  <TD className="text-center font-semibold text-verde">{r.alta}</TD>
                  <TD className="text-center font-semibold text-alerta">{r.mantenimiento}</TD>
                  <TD className="text-center font-semibold text-error">{r.baja}</TD>
                  <TD>
                    <Distribucion fila={r} />
                  </TD>
                </TR>
              ))
            )}
          </tbody>
          {filas.length > 0 && !conteoQuery.isPending && (
            <tfoot>
              <tr className="border-t-2 border-verde/30 bg-superficie font-extrabold">
                <TD>Total</TD>
                <TD className="text-center text-base">{totales.total}</TD>
                <TD className="text-center text-verde">{totales.alta}</TD>
                <TD className="text-center text-alerta">{totales.mantenimiento}</TD>
                <TD className="text-center text-error">{totales.baja}</TD>
                <TD />
              </tr>
            </tfoot>
          )}
        </Table>
      </Card>
    </PageContainer>
  );
}
