"use client";

import { useState } from "react";
import { BarChart3, MapPin, Pencil, Plus, Search, TriangleAlert } from "lucide-react";

import {
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  Label,
  PageContainer,
  PageHeader,
  Select,
} from "@/components/ui";
import { usePermiso } from "@/features/auth/usePermiso";
import { estadoComputadora } from "@/lib/estados";
import type { EquipoComputo, Sala } from "@/types/api";

import { ESTADOS_COMPUTADORA, contarEquipos, type ConteoSala } from "./equipos";
import { TONO_BARRA } from "./estilos";

type Orden = "nombre" | "problemas";

interface SalasViewProps {
  salas: Sala[];
  porSala: Map<number, EquipoComputo[]>;
  cargandoEquipos: boolean;
  onAbrir: (sala: Sala) => void;
  onResumen: (sala: Sala) => void;
  onEditar: (sala: Sala | null) => void;
}

/** Listado de salas con su estado general (antes ClassroomGrid.jsx). */
export function SalasView({ salas, porSala, cargandoEquipos, onAbrir, onResumen, onEditar }: SalasViewProps) {
  const puedeGestionarSalas = usePermiso("salas.gestionar");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<Orden>("nombre");

  const conteos = new Map(salas.map((s) => [s.idSala, contarEquipos(porSala.get(s.idSala) ?? [])]));
  const termino = busqueda.trim().toLowerCase();
  const visibles = salas
    .filter(
      (s) =>
        !termino ||
        s.codigoSala.toLowerCase().includes(termino) ||
        (s.nombre ?? "").toLowerCase().includes(termino) ||
        (s.ubicacion ?? "").toLowerCase().includes(termino),
    )
    .sort((a, b) => {
      const porNombre = (a.nombre ?? a.codigoSala).localeCompare(b.nombre ?? b.codigoSala, "es", { numeric: true });
      if (orden === "nombre") return porNombre;
      return (conteos.get(b.idSala)!.problemas - conteos.get(a.idSala)!.problemas) || porNombre;
    });

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Infraestructura"
        title="Mapa de Aulas"
        description="Estado de los equipos de cómputo de cada sala."
        actions={
          puedeGestionarSalas && (
            <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => onEditar(null)}>
              Registrar sala
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full flex-col gap-1 sm:w-80">
          <Label htmlFor="buscar-sala">Buscar sala</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" aria-hidden="true" />
            <Input
              id="buscar-sala"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Código, nombre o ubicación"
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="orden-salas">Ordenar por</Label>
          <Select id="orden-salas" value={orden} onChange={(e) => setOrden(e.target.value as Orden)} className="w-56">
            <option value="nombre">Nombre</option>
            <option value="problemas">Más equipos con problemas</option>
          </Select>
        </div>
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          title={termino ? "Ninguna sala coincide con la búsqueda" : "No hay salas registradas"}
          action={
            puedeGestionarSalas &&
            !termino && (
              <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => onEditar(null)}>
                Registrar sala
              </Button>
            )
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((s) => (
            <li key={s.idSala}>
              <TarjetaSala
                sala={s}
                conteo={conteos.get(s.idSala)!}
                cargando={cargandoEquipos}
                puedeEditar={puedeGestionarSalas}
                onAbrir={() => onAbrir(s)}
                onResumen={() => onResumen(s)}
                onEditar={() => onEditar(s)}
              />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}

function TarjetaSala({
  sala,
  conteo,
  cargando,
  puedeEditar,
  onAbrir,
  onResumen,
  onEditar,
}: {
  sala: Sala;
  conteo: ConteoSala;
  cargando: boolean;
  puedeEditar: boolean;
  onAbrir: () => void;
  onResumen: () => void;
  onEditar: () => void;
}) {
  const titulo = sala.nombre ?? sala.codigoSala;
  return (
    <Card className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold tracking-[0.06em] text-dorado-texto">{sala.codigoSala}</p>
          <h2 className="mt-0.5 truncate text-lg font-extrabold">{titulo}</h2>
          {sala.ubicacion && (
            <p className="mt-0.5 flex items-center gap-1 text-[13px] text-sobre-variante">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{sala.ubicacion}</span>
            </p>
          )}
        </div>
        {puedeEditar && (
          <IconButton label={`Editar sala ${titulo}`} size="sm" icon={<Pencil className="h-4 w-4" aria-hidden="true" />} onClick={onEditar} />
        )}
      </div>

      {cargando ? (
        <p className="text-sm text-sobre-variante">Cargando equipos...</p>
      ) : conteo.total === 0 ? (
        <p className="text-sm text-sobre-variante">Sin equipos registrados.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm">
              <span className="text-2xl font-extrabold">{conteo.total}</span> equipos
            </span>
            {conteo.problemas > 0 ? (
              <span className="flex items-center gap-1 text-sm font-bold text-alerta">
                <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                {conteo.problemas} con problemas
              </span>
            ) : (
              <span className="text-sm font-bold text-verde">Todos funcionando</span>
            )}
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-variante" aria-hidden="true">
            {ESTADOS_COMPUTADORA.map((e) => {
              const n = conteo.porEstado[e] ?? 0;
              if (n === 0) return null;
              return <span key={e} className={TONO_BARRA[estadoComputadora(e).tono]} style={{ width: `${(n / conteo.total) * 100}%` }} />;
            })}
          </div>
          <p className="sr-only">
            {ESTADOS_COMPUTADORA.map((e) => `${estadoComputadora(e).etiqueta}: ${conteo.porEstado[e] ?? 0}`).join(", ")}
          </p>
        </div>
      )}

      <div className="mt-auto flex gap-2.5 pt-1">
        <Button className="flex-1" onClick={onAbrir}>
          Ver equipos
        </Button>
        <Button variant="secondary" icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />} onClick={onResumen}>
          Resumen
        </Button>
      </div>
    </Card>
  );
}
