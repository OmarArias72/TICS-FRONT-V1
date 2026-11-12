"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, FilterX, History } from "lucide-react";
import { toast } from "react-hot-toast";

import { Alert, Button, Card, Input, Label, Select, StatusBadge, TD, TH, THead, TR, Table, TableMessage } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { bitacoraService } from "@/lib/api/services";
import { descargarArchivo } from "@/lib/download";
import { formatearFechaHora, hoyISO } from "@/lib/fechas";
import type { FiltrosBitacora, RegistroBitacora } from "@/types/api";

import { accionBitacora, nombreCampo, nombreOrigen, resumenAPares } from "../utils/etiquetas";
import { Paginacion } from "./Paginacion";

const TAMANO = 50;

/** Atajos para las preguntas más comunes de trazabilidad. */
const ATAJOS: Array<{ etiqueta: string; accion: string }> = [
  { etiqueta: "Todo", accion: "" },
  { etiqueta: "¿Quién registró?", accion: "ALTA" },
  { etiqueta: "Modificaciones", accion: "ACTUALIZAR" },
  { etiqueta: "Eliminaciones", accion: "ELIMINAR" },
];

/**
 * Bitácora de equipos (`GET /api/bitacora`): cada alta, modificación por
 * campo, cambio de estado, consulta de contraseñas y baja, con quién la hizo,
 * desde qué módulo, cuándo y desde qué IP. Admin y Operador-tics.
 */
export function BitacoraEquiposView({ inventarioInicial }: { inventarioInicial: string }) {
  const [inventario, setInventario] = useState(inventarioInicial);
  const [texto, setTexto] = useState("");
  const [origen, setOrigen] = useState("");
  const [accion, setAccion] = useState("");
  const [idUsuario, setIdUsuario] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [pagina, setPagina] = useState(0);

  const inventarioDebounced = useDebouncedValue(inventario.trim(), 300);
  const textoDebounced = useDebouncedValue(texto.trim(), 300);

  const filtros: FiltrosBitacora = {
    inventario: inventarioDebounced || undefined,
    texto: textoDebounced || undefined,
    origen: origen || undefined,
    accion: accion || undefined,
    idUsuario: idUsuario ? Number(idUsuario) : undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
  };
  const rangoInvalido = Boolean(desde && hasta && hasta < desde);

  const catalogos = useQuery({ queryKey: ["bitacora", "catalogos"], queryFn: bitacoraService.catalogos, staleTime: 60_000 });
  const query = useQuery({
    queryKey: ["bitacora", filtros, pagina],
    queryFn: () => bitacoraService.buscar(filtros, pagina, TAMANO),
    enabled: !rangoInvalido,
    placeholderData: keepPreviousData,
  });

  const exportar = useMutation({
    mutationFn: () => bitacoraService.exportarCsv(filtros),
    onSuccess: (blob) => {
      descargarArchivo(blob, `bitacora-equipos-${hoyISO()}.csv`);
      toast.success("Bitácora exportada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /** Cualquier filtro nuevo vuelve a la primera página. */
  const cambiar = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPagina(0);
  };

  const hayFiltros = Boolean(inventario || texto || origen || accion || idUsuario || desde || hasta);
  const limpiar = () => {
    setInventario("");
    setTexto("");
    setOrigen("");
    setAccion("");
    setIdUsuario("");
    setDesde("");
    setHasta("");
    setPagina(0);
  };

  const registros = query.data?.contenido ?? [];
  const acciones = catalogos.data?.acciones ?? [];

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4 p-5">
        <div role="group" aria-label="Atajos" className="flex flex-wrap gap-2">
          {ATAJOS.map((a) => {
            const activo = accion === a.accion;
            return (
              <button
                key={a.etiqueta}
                type="button"
                aria-pressed={activo}
                onClick={() => cambiar(setAccion)(a.accion)}
                className={
                  "h-9 rounded-full border px-3.5 text-[13px] font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado " +
                  (activo ? "border-verde bg-verde text-white" : "border-variante bg-white text-sobre-variante hover:border-verde/50")
                }
              >
                {a.etiqueta}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="bit-inventario">Equipo (inventario)</Label>
            <Input
              id="bit-inventario"
              type="search"
              value={inventario}
              onChange={(e) => cambiar(setInventario)(e.target.value)}
              placeholder="INV-2026-001"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="bit-usuario">Quién</Label>
            <Select id="bit-usuario" value={idUsuario} onChange={(e) => cambiar(setIdUsuario)(e.target.value)}>
              <option value="">Cualquier usuario</option>
              {(catalogos.data?.usuarios ?? []).map((u) => (
                <option key={u.idUsuario} value={String(u.idUsuario)}>
                  {u.nombre} ({u.correo})
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="bit-accion">Acción</Label>
            <Select id="bit-accion" value={accion} onChange={(e) => cambiar(setAccion)(e.target.value)}>
              <option value="">Todas</option>
              {/* La acción elegida se conserva aunque aún no tenga registros */}
              {[...new Set([...acciones, ...(accion ? [accion] : [])])].map((a) => (
                <option key={a} value={a}>
                  {accionBitacora(a).etiqueta}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="bit-origen">Módulo</Label>
            <Select id="bit-origen" value={origen} onChange={(e) => cambiar(setOrigen)(e.target.value)}>
              <option value="">Todos</option>
              {(catalogos.data?.origenes ?? []).map((o) => (
                <option key={o} value={o}>
                  {nombreOrigen(o)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label htmlFor="bit-texto">Buscar en los cambios</Label>
            <Input
              id="bit-texto"
              type="search"
              value={texto}
              onChange={(e) => cambiar(setTexto)(e.target.value)}
              placeholder="Valor, campo u observación (sin importar acentos)"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="bit-desde">Desde</Label>
            <Input id="bit-desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => cambiar(setDesde)(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="bit-hasta">Hasta</Label>
            <Input id="bit-hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => cambiar(setHasta)(e.target.value)} />
          </div>
        </div>

        {rangoInvalido && <Alert tone="alerta">La fecha final no puede ser anterior a la inicial.</Alert>}

        <div className="flex flex-wrap justify-end gap-2.5">
          {hayFiltros && (
            <Button variant="ghost" icon={<FilterX className="h-4 w-4" aria-hidden="true" />} onClick={limpiar}>
              Limpiar filtros
            </Button>
          )}
          <Button
            variant="secondary"
            loading={exportar.isPending}
            disabled={rangoInvalido || (query.data?.totalElementos ?? 0) === 0}
            icon={<Download className="h-4 w-4" aria-hidden="true" />}
            onClick={() => exportar.mutate()}
          >
            Exportar CSV
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table minWidth={1000}>
          <THead>
            <tr>
              <TH>Fecha</TH>
              <TH>Equipo</TH>
              <TH>Acción</TH>
              <TH>Cambio</TH>
              <TH>Quién</TH>
            </tr>
          </THead>
          <tbody>
            {query.isPending && !rangoInvalido ? (
              <TableMessage colSpan={5} loading>
                Cargando bitácora...
              </TableMessage>
            ) : query.isError ? (
              <TableMessage colSpan={5} tone="error">
                {query.error.message}
              </TableMessage>
            ) : registros.length === 0 ? (
              <TableMessage colSpan={5}>
                <History className="h-4 w-4" aria-hidden="true" />
                {hayFiltros ? "No hay registros con estos filtros." : "Aún no hay cambios registrados."}
              </TableMessage>
            ) : (
              registros.map((r) => <FilaBitacora key={r.idBitacora} r={r} onFiltrarEquipo={cambiar(setInventario)} />)
            )}
          </tbody>
        </Table>
        {query.data && (
          <Paginacion
            pagina={query.data.pagina}
            totalPaginas={query.data.totalPaginas}
            totalElementos={query.data.totalElementos}
            cargando={query.isFetching}
            onCambiar={setPagina}
          />
        )}
      </Card>
    </div>
  );
}

function FilaBitacora({ r, onFiltrarEquipo }: { r: RegistroBitacora; onFiltrarEquipo: (inv: string) => void }) {
  const esResumen = r.campoModificado === "TODOS" || r.campoModificado === "DETALLE_TECNICO";
  const pares = esResumen ? resumenAPares(r.valorNuevo ?? r.valorAnterior) : [];
  return (
    <TR className="align-top">
      <TD className="whitespace-nowrap text-[13px]">
        {formatearFechaHora(r.fechaHora)}
        {r.ip && <span className="mt-0.5 block text-[11px] text-outline">IP {r.ip}</span>}
      </TD>
      <TD className="whitespace-nowrap">
        <button
          type="button"
          onClick={() => onFiltrarEquipo(r.inventario)}
          title={`Ver solo ${r.inventario}`}
          className="font-extrabold text-verde hover:text-dorado-texto focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado"
        >
          {r.inventario}
        </button>
        <span className="block text-[12px] text-sobre-variante">{nombreOrigen(r.origen)}</span>
      </TD>
      <TD>
        <StatusBadge {...accionBitacora(r.accion)} />
      </TD>
      <TD className="max-w-md text-[13px]">
        {esResumen ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            {pares.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-sobre-variante">{k}</dt>
                <dd className="break-words font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        ) : r.campoModificado ? (
          <p className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold">{nombreCampo(r.campoModificado)}:</span>
            <span className="break-words text-sobre-variante line-through decoration-outline/60">{r.valorAnterior || "(vacío)"}</span>
            <ArrowRight className="h-3.5 w-3.5 text-outline" aria-label="cambió a" />
            <span className="break-words font-semibold">{r.valorNuevo || "(vacío)"}</span>
          </p>
        ) : null}
        {r.observacion && <p className="mt-1 italic text-sobre-variante">“{r.observacion}”</p>}
      </TD>
      <TD className="whitespace-nowrap">
        <span className="block font-semibold">{r.usuario}</span>
        {r.correoUsuario && <span className="block text-[12px] text-sobre-variante">{r.correoUsuario}</span>}
      </TD>
    </TR>
  );
}
