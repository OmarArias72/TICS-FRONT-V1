"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, BarChart3, Monitor, MousePointerClick, Plus, Search } from "lucide-react";

import { Button, Card, EmptyState, Input, Label, PageContainer, PageHeader } from "@/components/ui";
import { usePermiso } from "@/features/auth/usePermiso";
import { cn } from "@/lib/cn";
import { estadoComputadora } from "@/lib/estados";
import type { EquipoComputo, Sala } from "@/types/api";

import { EquipoDetalle } from "./EquipoDetalle";
import { ESTADOS_COMPUTADORA, compararPorPrioridad, contarEquipos, estadoPc } from "./equipos";
import { TONO_ICONO, TONO_TARJETA } from "./estilos";

type Filtro = "TODOS" | "PROBLEMAS" | (typeof ESTADOS_COMPUTADORA)[number];

interface SalaEquiposViewProps {
  sala: Sala;
  equipos: EquipoComputo[];
  cargando: boolean;
  idSeleccionado: number | null;
  onSeleccionar: (id: number) => void;
  onVolver: () => void;
  onResumen: () => void;
  onNuevo: () => void;
  onEditar: (equipo: EquipoComputo) => void;
  onEliminar: (equipo: EquipoComputo) => void;
}

/** Equipos de una sala: cuadrícula por estado y panel de detalle (antes ComputerGrid.jsx). */
export function SalaEquiposView({
  sala,
  equipos,
  cargando,
  idSeleccionado,
  onSeleccionar,
  onVolver,
  onResumen,
  onNuevo,
  onEditar,
  onEliminar,
}: SalaEquiposViewProps) {
  const puedeGestionar = usePermiso("equipos.gestionar");
  const sinAnimacion = useReducedMotion();
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const conteo = contarEquipos(equipos);
  const termino = busqueda.trim().toLowerCase();
  const visibles = equipos
    .filter((ec) => {
      const e = estadoPc(ec);
      if (filtro === "PROBLEMAS") return e !== "Funcionando";
      return filtro === "TODOS" || e === filtro;
    })
    .filter(
      (ec) =>
        !termino ||
        ec.equipo.inventario.toLowerCase().includes(termino) ||
        (ec.equipo.serie ?? "").toLowerCase().includes(termino),
    )
    .sort(compararPorPrioridad);
  const seleccionado = equipos.find((ec) => ec.idEquipoComputo === idSeleccionado) ?? null;

  const filtros: Array<{ valor: Filtro; etiqueta: string; cantidad: number }> = [
    { valor: "TODOS", etiqueta: "Todos", cantidad: conteo.total },
    { valor: "PROBLEMAS", etiqueta: "Con problemas", cantidad: conteo.problemas },
    ...ESTADOS_COMPUTADORA.map((e) => ({ valor: e, etiqueta: estadoComputadora(e).etiqueta, cantidad: conteo.porEstado[e] ?? 0 })),
  ];

  const seleccionar = (id: number) => {
    onSeleccionar(id);
    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  return (
    <PageContainer>
      <div>
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />} onClick={onVolver}>
          Todas las salas
        </Button>
      </div>
      <PageHeader
        eyebrow={`Sala ${sala.codigoSala}`}
        title={sala.nombre ?? sala.codigoSala}
        description={sala.ubicacion ?? undefined}
        actions={
          <>
            <Button variant="secondary" icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />} onClick={onResumen}>
              Resumen
            </Button>
            {puedeGestionar && (
              <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={onNuevo}>
                Registrar equipo
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
          {filtros.map((f) => {
            const activo = filtro === f.valor;
            return (
              <button
                key={f.valor}
                type="button"
                aria-pressed={activo}
                onClick={() => setFiltro(f.valor)}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado",
                  activo ? "border-verde bg-verde text-white" : "border-variante bg-white text-sobre-variante hover:border-verde/50",
                )}
              >
                {f.etiqueta}
                <span className={cn("rounded-full px-2 text-xs", activo ? "bg-white/20" : "bg-variante")}>{f.cantidad}</span>
              </button>
            );
          })}
        </div>
        <div className="flex w-full flex-col gap-1 sm:w-64">
          <Label htmlFor="buscar-equipo">Buscar equipo</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" aria-hidden="true" />
            <Input
              id="buscar-equipo"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Inventario o serie"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-label="Equipos de la sala" className="min-w-0 flex-[999_1_520px]">
          {cargando ? (
            <p className="text-sm text-sobre-variante">Cargando equipos...</p>
          ) : visibles.length === 0 ? (
            <EmptyState
              icon={<Monitor className="h-8 w-8" aria-hidden="true" />}
              title={equipos.length === 0 ? "Esta sala no tiene equipos registrados" : "Ningún equipo coincide con el filtro"}
              action={
                puedeGestionar &&
                equipos.length === 0 && (
                  <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={onNuevo}>
                    Registrar equipo
                  </Button>
                )
              }
            />
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3">
              {visibles.map((ec, i) => {
                const estado = estadoComputadora(estadoPc(ec));
                const activo = ec.idEquipoComputo === idSeleccionado;
                return (
                  <motion.li
                    key={ec.idEquipoComputo}
                    initial={sinAnimacion ? false : { opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15, delay: Math.min(i, 20) * 0.015 }}
                  >
                    <button
                      type="button"
                      aria-pressed={activo}
                      onClick={() => seleccionar(ec.idEquipoComputo)}
                      className={cn(
                        "flex w-full flex-col items-center gap-1.5 rounded-2xl border px-2 py-3.5 text-center transition-colors",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado focus-visible:ring-offset-2",
                        TONO_TARJETA[estado.tono],
                        activo && "ring-2 ring-verde ring-offset-2",
                      )}
                    >
                      <Monitor className={cn("h-7 w-7", TONO_ICONO[estado.tono])} aria-hidden="true" />
                      <span className="w-full truncate text-[13px] font-extrabold">{ec.equipo.inventario}</span>
                      <span className="text-[11px] font-semibold text-sobre-variante">{estado.etiqueta}</span>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </section>

        <div ref={panelRef} className="min-w-0 flex-[1_1_360px] scroll-mt-20 lg:sticky lg:top-20">
          {seleccionado ? (
            <EquipoDetalle
              key={seleccionado.idEquipoComputo}
              equipo={seleccionado}
              onEditar={() => onEditar(seleccionado)}
              onEliminar={() => onEliminar(seleccionado)}
            />
          ) : (
            <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <MousePointerClick className="h-8 w-8 text-verde" aria-hidden="true" />
              <p className="font-bold">Selecciona un equipo</p>
              <p className="max-w-xs text-sm text-sobre-variante">Verás su estado, periféricos, hardware y contraseñas.</p>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
