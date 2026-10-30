"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Search, X } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  Button,
  Card,
  ConfirmDialog,
  Input,
  Label,
  PageContainer,
  Select,
} from "@/components/ui";
import { usePermiso } from "@/features/auth/usePermiso";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { inventoryService } from "@/lib/api/services";
import type { EquipoCreateRequest, EquipoVista, EstadoEquipo } from "@/types/api";

import { EquipoFormModal } from "./EquipoFormModal";
import { EquiposTable } from "./EquiposTable";
import { InventoryHeader } from "./InventoryHeader";
import { ReporteModal } from "./ReporteModal";
import type { EquipoFormValues } from "./schemas";

type TipoBusqueda = "global" | "serie" | "marca" | "modelo" | "articulo";

const TIPOS_BUSQUEDA: Array<{ valor: TipoBusqueda; etiqueta: string }> = [
  { valor: "global", etiqueta: "Búsqueda global" },
  { valor: "serie", etiqueta: "Número de serie" },
  { valor: "marca", etiqueta: "Marca" },
  { valor: "modelo", etiqueta: "Modelo" },
  { valor: "articulo", etiqueta: "Artículo" },
];

const CLAVE_EQUIPOS = "equipos";
const CLAVE_CONTEO = "conteo-inventario";

function buscarEquipos(tipo: TipoBusqueda, termino: string): Promise<EquipoVista[]> {
  if (!termino) return inventoryService.listarEquipos();
  switch (tipo) {
    case "serie":
      return inventoryService.buscarPorSerie(termino);
    case "marca":
      return inventoryService.buscarPorMarca(termino);
    case "modelo":
      return inventoryService.buscarPorModelo(termino);
    case "articulo":
      return inventoryService.buscarPorArticulo(termino);
    default:
      return inventoryService.buscarGlobal(termino);
  }
}

/** Convierte "YYYY-MM-DD" a milisegundos al inicio o al final de ese día local. */
function limiteDelDia(fecha: string, fin: boolean): number {
  const [a, m, d] = fecha.split("-").map(Number);
  return fin ? new Date(a, m - 1, d, 23, 59, 59, 999).getTime() : new Date(a, m - 1, d).getTime();
}

/**
 * Inventario general (antes InventoryPage.jsx).
 *
 * Decisiones 2026-10-30: búsqueda en el backend mientras se escribe; reportes
 * en un modal; el Operador no elimina ni da de BAJA, y no puede cambiar el
 * estado de equipos que ya están en BAJA.
 */
export function InventoryPage() {
  const queryClient = useQueryClient();
  const puedeCrear = usePermiso("inventario.crear");
  const puedeEditar = usePermiso("inventario.editar");
  const puedeEliminar = usePermiso("inventario.eliminar");
  const puedeEstadoMasivo = usePermiso("inventario.estadoMasivo");
  const puedeDarDeBaja = usePermiso("inventario.darDeBaja");
  const puedeReportes = usePermiso("inventario.reportes");

  const [tipo, setTipo] = useState<TipoBusqueda>("global");
  const [texto, setTexto] = useState("");
  const termino = useDebouncedValue(texto.trim(), 300);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const [seleccion, setSeleccion] = useState<Set<string>>(() => new Set());
  const [estadoMasivo, setEstadoMasivo] = useState<EstadoEquipo | "">("");
  const [confirmarBaja, setConfirmarBaja] = useState(false);

  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<EquipoVista | null>(null);
  const [porEliminar, setPorEliminar] = useState<EquipoVista | null>(null);
  const [reporteAbierto, setReporteAbierto] = useState(false);

  const equiposQuery = useQuery({
    queryKey: [CLAVE_EQUIPOS, tipo, termino],
    queryFn: () => buscarEquipos(tipo, termino),
    // Mantiene la tabla anterior visible mientras llega la nueva búsqueda.
    placeholderData: keepPreviousData,
  });

  // Filtro local por fecha de registro (como en el original).
  const equipos = useMemo(() => {
    const lista = equiposQuery.data ?? [];
    if (!desde && !hasta) return lista;
    const inicio = desde ? limiteDelDia(desde, false) : -Infinity;
    const fin = hasta ? limiteDelDia(hasta, true) : Infinity;
    return lista.filter((e) => {
      if (!e.fechaRegistro) return false;
      const t = new Date(e.fechaRegistro).getTime();
      return t >= inicio && t <= fin;
    });
  }, [equiposQuery.data, desde, hasta]);

  // El Operador no puede cambiar el estado de un equipo en BAJA.
  const esSeleccionable = (e: EquipoVista) =>
    puedeEstadoMasivo && (puedeDarDeBaja || e.estado !== "BAJA");

  // La selección efectiva son solo los equipos visibles y seleccionables:
  // si una búsqueda oculta equipos marcados, no se modifican por error.
  const seleccionVisible = equipos.filter((e) => seleccion.has(e.inventario) && esSeleccionable(e));

  const refrescar = () => {
    void queryClient.invalidateQueries({ queryKey: [CLAVE_EQUIPOS] });
    void queryClient.invalidateQueries({ queryKey: [CLAVE_CONTEO] });
  };

  const guardar = useMutation({
    mutationFn: (values: EquipoFormValues) => {
      const payload: EquipoCreateRequest = {
        inventario: values.inventario.trim(),
        serie: values.serie.trim() || null,
        nombreArticulo: values.nombreArticulo.trim(),
        // Corrección: el original enviaba `marca` y `modelo`, que el backend
        // ignora; por eso todo quedaba como GENÉRICA / GENÉRICO.
        nombreMarca: values.nombreMarca.trim() || null,
        nombreModelo: values.nombreModelo.trim() || null,
        cantidad: values.cantidad,
        caracteristicas: values.caracteristicas.trim() || null,
        estado: values.estado,
      };
      return editando
        ? inventoryService.actualizarEquipo(editando.inventario, payload)
        : inventoryService.crearEquipoCompleto(payload);
    },
    onSuccess: () => {
      refrescar();
      toast.success(editando ? "Equipo actualizado" : "Equipo registrado");
      setFormAbierto(false);
      setEditando(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const eliminar = useMutation({
    mutationFn: (e: EquipoVista) => inventoryService.eliminarEquipo(e.inventario),
    onSuccess: (_, e) => {
      refrescar();
      setSeleccion((prev) => {
        const siguiente = new Set(prev);
        siguiente.delete(e.inventario);
        return siguiente;
      });
      toast.success(`Equipo ${e.inventario} eliminado`);
      setPorEliminar(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ inventarios, nuevoEstado }: { inventarios: string[]; nuevoEstado: EstadoEquipo }) =>
      inventoryService.actualizarEstadoMasivo(inventarios, nuevoEstado),
    onSuccess: (actualizados, { nuevoEstado }) => {
      refrescar();
      setSeleccion(new Set());
      setEstadoMasivo("");
      setConfirmarBaja(false);
      toast.success(`${actualizados.length} equipo(s) pasaron a ${nuevoEstado}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const aplicarEstado = () => {
    if (!estadoMasivo || seleccionVisible.length === 0) return;
    if (estadoMasivo === "BAJA") {
      setConfirmarBaja(true);
      return;
    }
    cambiarEstado.mutate({
      inventarios: seleccionVisible.map((e) => e.inventario),
      nuevoEstado: estadoMasivo,
    });
  };

  const alternarSeleccion = (inventario: string) =>
    setSeleccion((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(inventario)) siguiente.delete(inventario);
      else siguiente.add(inventario);
      return siguiente;
    });

  const seleccionarTodos = (marcar: boolean) =>
    setSeleccion(marcar ? new Set(equipos.filter(esSeleccionable).map((e) => e.inventario)) : new Set());

  const hayFiltros = texto !== "" || tipo !== "global" || desde !== "" || hasta !== "";
  const limpiarFiltros = () => {
    setTexto("");
    setTipo("global");
    setDesde("");
    setHasta("");
  };

  const estadosMasivos: EstadoEquipo[] = puedeDarDeBaja
    ? ["ALTA", "MANTENIMIENTO", "BAJA"]
    : ["ALTA", "MANTENIMIENTO"];

  const total = equipos.length;

  return (
    <PageContainer>
      <InventoryHeader
        description={
          equiposQuery.isSuccess
            ? `${total} ${total === 1 ? "equipo" : "equipos"}${hayFiltros ? " con los filtros actuales" : " registrados"}`
            : "Equipos registrados en el inventario institucional."
        }
        actions={
          <>
            {puedeReportes && (
              <Button
                variant="accent"
                icon={<Download className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setReporteAbierto(true)}
              >
                Reporte
              </Button>
            )}
            {puedeCrear && (
              <Button
                icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                onClick={() => {
                  setEditando(null);
                  setFormAbierto(true);
                }}
              >
                Nuevo equipo
              </Button>
            )}
          </>
        }
      />

      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tipo-busqueda">Buscar por</Label>
          <Select
            id="tipo-busqueda"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoBusqueda)}
            className="w-48"
          >
            {TIPOS_BUSQUEDA.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.etiqueta}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex min-w-60 flex-1 flex-col gap-1.5">
          <Label htmlFor="termino-busqueda">Término</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-sobre-variante"
              aria-hidden="true"
            />
            <Input
              id="termino-busqueda"
              type="search"
              placeholder="Inventario, serie, marca o modelo"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="registro-desde">Registrados desde</Label>
          <Input id="registro-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-44" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="registro-hasta">Hasta</Label>
          <Input id="registro-hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className="w-44" />
        </div>
        {hayFiltros && (
          <Button variant="ghost" icon={<X className="h-4 w-4" aria-hidden="true" />} onClick={limpiarFiltros}>
            Limpiar
          </Button>
        )}
      </Card>

      {seleccionVisible.length > 0 && (
        <div
          role="region"
          aria-label="Acciones sobre la selección"
          className="flex flex-wrap items-center gap-3 rounded-2xl bg-verde px-4 py-3 text-superficie"
        >
          <span className="text-sm font-bold">
            {seleccionVisible.length} {seleccionVisible.length === 1 ? "equipo seleccionado" : "equipos seleccionados"}
          </span>
          <label className="flex items-center gap-2 text-sm text-verde-claro">
            Cambiar estado a
            <select
              value={estadoMasivo}
              onChange={(e) => setEstadoMasivo(e.target.value as EstadoEquipo | "")}
              className="h-10 rounded-xl border-0 bg-white px-3 text-sm font-semibold text-sobre-superficie"
            >
              <option value="">Selecciona...</option>
              {estadosMasivos.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="accent"
            size="sm"
            className="h-10"
            disabled={!estadoMasivo}
            loading={cambiarEstado.isPending}
            onClick={aplicarEstado}
          >
            Aplicar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-10 text-verde-claro hover:bg-verde-hover hover:text-white"
            onClick={() => setSeleccion(new Set())}
          >
            Quitar selección
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        <EquiposTable
          equipos={equipos}
          cargando={equiposQuery.isPending}
          error={equiposQuery.isError ? equiposQuery.error.message : null}
          seleccionados={seleccion}
          esSeleccionable={esSeleccionable}
          onAlternarSeleccion={alternarSeleccion}
          onSeleccionarTodos={seleccionarTodos}
          puedeEditar={puedeEditar}
          puedeEliminar={puedeEliminar}
          onEditar={(e) => {
            setEditando(e);
            setFormAbierto(true);
          }}
          onEliminar={setPorEliminar}
        />
      </Card>

      <EquipoFormModal
        open={formAbierto}
        onClose={() => {
          setFormAbierto(false);
          setEditando(null);
        }}
        equipo={editando}
        puedeDarDeBaja={puedeDarDeBaja}
        saving={guardar.isPending}
        onSubmit={(values) => guardar.mutate(values)}
      />

      <ReporteModal open={reporteAbierto} onClose={() => setReporteAbierto(false)} />

      <ConfirmDialog
        open={porEliminar !== null}
        onClose={() => setPorEliminar(null)}
        onConfirm={() => porEliminar && eliminar.mutate(porEliminar)}
        loading={eliminar.isPending}
        title={`¿Eliminar ${porEliminar?.inventario ?? ""}?`}
        description="El equipo se quitará del inventario. Esta acción no se puede deshacer; si solo dejó de usarse, dalo de BAJA."
        confirmLabel="Eliminar equipo"
      />

      <ConfirmDialog
        open={confirmarBaja}
        onClose={() => setConfirmarBaja(false)}
        onConfirm={() =>
          cambiarEstado.mutate({
            inventarios: seleccionVisible.map((e) => e.inventario),
            nuevoEstado: "BAJA",
          })
        }
        loading={cambiarEstado.isPending}
        title={`¿Dar de BAJA ${seleccionVisible.length} ${seleccionVisible.length === 1 ? "equipo" : "equipos"}?`}
        description="Los equipos quedarán retirados del inventario activo. Solo un administrador podrá reactivarlos."
        confirmLabel="Dar de BAJA"
      />
    </PageContainer>
  );
}
