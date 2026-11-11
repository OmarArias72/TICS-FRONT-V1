"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { Download, FilterX, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";

import { Alert, Button, Card, Input, Label, Select, StatusBadge, TD, TH, THead, TR, Table, TableMessage } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { auditoriaService } from "@/lib/api/services";
import { descargarArchivo } from "@/lib/download";
import { formatearFechaHora, hoyISO } from "@/lib/fechas";
import type { FiltrosAuditoria } from "@/types/api";

import { accionAuditoria } from "./etiquetas";
import { Paginacion } from "./Paginacion";

const TAMANO = 50;

/**
 * Auditoría del sistema (`GET /api/auditoria`, solo Admin): inicios de sesión,
 * altas y cambios de usuarios, salas y reservas, consultas de CURP, reportes
 * generados, bloqueos... con quién, cuándo y desde qué IP.
 */
export function AuditoriaView() {
  const [accion, setAccion] = useState("");
  const [entidad, setEntidad] = useState("");
  const [texto, setTexto] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [pagina, setPagina] = useState(0);
  const textoDebounced = useDebouncedValue(texto.trim(), 300);

  const filtros: FiltrosAuditoria = {
    accion: accion || undefined,
    entidad: entidad || undefined,
    texto: textoDebounced || undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
  };
  const rangoInvalido = Boolean(desde && hasta && hasta < desde);

  const catalogos = useQuery({ queryKey: ["auditoria", "catalogos"], queryFn: auditoriaService.catalogos, staleTime: 60_000 });
  const query = useQuery({
    queryKey: ["auditoria", filtros, pagina],
    queryFn: () => auditoriaService.buscar(filtros, pagina, TAMANO),
    enabled: !rangoInvalido,
    placeholderData: keepPreviousData,
  });

  const exportar = useMutation({
    mutationFn: () => auditoriaService.exportarCsv(filtros),
    onSuccess: (blob) => {
      descargarArchivo(blob, `auditoria-${hoyISO()}.csv`);
      toast.success("Auditoría exportada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cambiar = (set: (v: string) => void) => (v: string) => {
    set(v);
    setPagina(0);
  };
  const hayFiltros = Boolean(accion || entidad || texto || desde || hasta);
  const limpiar = () => {
    setAccion("");
    setEntidad("");
    setTexto("");
    setDesde("");
    setHasta("");
    setPagina(0);
  };
  const registros = query.data?.contenido ?? [];

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-1 lg:col-span-2">
            <Label htmlFor="aud-texto">Buscar</Label>
            <Input
              id="aud-texto"
              type="search"
              value={texto}
              onChange={(e) => cambiar(setTexto)(e.target.value)}
              placeholder="Correo, descripción o ID"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="aud-accion">Acción</Label>
            <Select id="aud-accion" value={accion} onChange={(e) => cambiar(setAccion)(e.target.value)}>
              <option value="">Todas</option>
              {(catalogos.data?.acciones ?? []).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="aud-entidad">Entidad</Label>
            <Select id="aud-entidad" value={entidad} onChange={(e) => cambiar(setEntidad)(e.target.value)}>
              <option value="">Todas</option>
              {(catalogos.data?.entidades ?? []).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="aud-desde">Desde</Label>
              <Input id="aud-desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => cambiar(setDesde)(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="aud-hasta">Hasta</Label>
              <Input id="aud-hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => cambiar(setHasta)(e.target.value)} />
            </div>
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
        <Table minWidth={900}>
          <THead>
            <tr>
              <TH>Fecha</TH>
              <TH>Acción</TH>
              <TH>Sobre</TH>
              <TH>Descripción</TH>
              <TH>Quién</TH>
            </tr>
          </THead>
          <tbody>
            {query.isPending && !rangoInvalido ? (
              <TableMessage colSpan={5} loading>
                Cargando auditoría...
              </TableMessage>
            ) : query.isError ? (
              <TableMessage colSpan={5} tone="error">
                {query.error.message}
              </TableMessage>
            ) : registros.length === 0 ? (
              <TableMessage colSpan={5}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                No hay registros con estos filtros.
              </TableMessage>
            ) : (
              registros.map((a) => (
                <TR key={a.idAuditoria} className="align-top">
                  <TD className="whitespace-nowrap text-[13px]">
                    {formatearFechaHora(a.fecha)}
                    {a.ip && <span className="mt-0.5 block text-[11px] text-outline">IP {a.ip}</span>}
                  </TD>
                  <TD>
                    <StatusBadge {...accionAuditoria(a.accion)} />
                  </TD>
                  <TD className="whitespace-nowrap text-[13px]">
                    <span className="font-bold">{a.entidad}</span>
                    {a.idEntidad && <span className="text-sobre-variante"> #{a.idEntidad}</span>}
                  </TD>
                  <TD className="max-w-md break-words text-[13px] text-sobre-variante">{a.descripcion || "—"}</TD>
                  <TD className="whitespace-nowrap text-[13px]">{a.correoUsuario ?? "Sistema / anónimo"}</TD>
                </TR>
              ))
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
