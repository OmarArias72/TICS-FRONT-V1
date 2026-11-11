"use client";

import { useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Cable,
  CircleCheck,
  CircleHelp,
  Copy,
  Cpu,
  Eye,
  EyeOff,
  HardDrive,
  History,
  KeyRound,
  Keyboard,
  MemoryStick,
  Monitor,
  MonitorCog,
  Mouse,
  NotebookPen,
  Pencil,
  Plug,
  Server,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Button, ButtonLink, Card, StatusBadge } from "@/components/ui";
import { usePermiso } from "@/features/auth/usePermiso";
import { equipoComputoService } from "@/lib/api/services";
import { cn } from "@/lib/cn";
import { estadoComputadora, estadoEquipo } from "@/lib/estados";
import { formatearFecha } from "@/lib/fechas";
import type { ContrasenasEquipo, EquipoComputo } from "@/types/api";

import { NOMBRE_PERIFERICO, estadoPc, perifericoConFalla, valorPeriferico, type Periferico } from "./equipos";

const PERIFERICOS: Array<{ clave: Periferico; Icono: LucideIcon }> = [
  { clave: "cpu", Icono: Cpu },
  { clave: "monitor", Icono: Monitor },
  { clave: "teclado", Icono: Keyboard },
  { clave: "mouse", Icono: Mouse },
  { clave: "ethernet", Icono: Cable },
];

interface EquipoDetalleProps {
  equipo: EquipoComputo;
  onEditar: () => void;
  onEliminar: () => void;
}

/**
 * Panel lateral con el detalle de una PC (antes ComputerDetails.jsx).
 *
 * Diseño (2026-11-02): cada grupo de datos va en su propia caja con título e
 * icono; cada dato lleva su etiqueta arriba y el valor en negritas; el estado
 * de cada periférico se distingue por color e icono, no solo por el texto.
 */
export function EquipoDetalle({ equipo: ec, onEditar, onEliminar }: EquipoDetalleProps) {
  const puedeGestionar = usePermiso("equipos.gestionar");
  const puedeVerHistorial = usePermiso("bitacora.equipos");
  const verContrasenas = usePermiso("equipos.verContrasenas");
  const fallas = PERIFERICOS.filter(({ clave }) => perifericoConFalla(valorPeriferico(ec, clave))).length;
  const software = (ec.softwareInstalado ?? "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Encabezado: identificación del equipo */}
      <div className="flex flex-col gap-5 border-b border-variante bg-superficie px-6 py-6 sm:px-8 sm:py-7">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-dorado-texto">{ec.nombreArticulo}</p>
          <h2 className="mt-1 break-all text-3xl font-extrabold leading-tight">{ec.inventario}</h2>
          <p className="mt-1.5 text-base font-semibold text-sobre-variante">
            {ec.nombreMarca} {ec.nombreModelo}
          </p>
          {ec.serie && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-variante bg-white px-2.5 py-1 text-xs">
              <span className="font-bold uppercase tracking-[0.06em] text-sobre-variante">Serie</span>
              <span className="font-mono font-semibold">{ec.serie}</span>
            </p>
          )}
        </div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-variante bg-white px-3 py-2.5">
            <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-sobre-variante">Estado de la PC</dt>
            <dd className="mt-1.5">
              <StatusBadge {...estadoComputadora(estadoPc(ec))} />
            </dd>
          </div>
          <div className="rounded-xl border border-variante bg-white px-3 py-2.5">
            <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-sobre-variante">Inventario</dt>
            <dd className="mt-1.5">
              <StatusBadge {...estadoEquipo(ec.estado)} />
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <Seccion
          titulo="Periféricos"
          Icono={Plug}
          resumen={
            fallas > 0 ? (
              <span className="text-xs font-bold text-error">{fallas} con falla</span>
            ) : (
              <span className="text-xs font-bold text-verde">Todos en buen estado</span>
            )
          }
        >
          <ul className="divide-y divide-variante">
            {PERIFERICOS.map(({ clave, Icono }) => (
              <FilaPeriferico key={clave} nombre={NOMBRE_PERIFERICO[clave]} Icono={Icono} valor={valorPeriferico(ec, clave)} />
            ))}
          </ul>
        </Seccion>

        <Seccion titulo="Hardware" Icono={Server}>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DatoIcono etiqueta="Procesador" Icono={Cpu} valor={ec.procesador} />
            <DatoIcono etiqueta="Memoria RAM" Icono={MemoryStick} valor={ec.ram} />
            <DatoIcono etiqueta="Almacenamiento" Icono={HardDrive} valor={ec.almacenamiento} />
            <DatoIcono etiqueta="Sistema operativo" Icono={MonitorCog} valor={ec.sistemaOperativo} />
          </dl>
          {ec.especificacionesHardware && (
            <div className="mt-2.5 rounded-xl border border-variante bg-white px-3.5 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-sobre-variante">Otras especificaciones</p>
              <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-relaxed">{ec.especificacionesHardware}</p>
            </div>
          )}
        </Seccion>

        {software.length > 0 && (
          <Seccion titulo="Software instalado" Icono={MonitorCog}>
            <ul className="flex flex-wrap gap-1.5">
              {software.map((programa, i) => (
                <li
                  key={`${programa}-${i}`}
                  className="rounded-lg border border-info/20 bg-info-claro px-2.5 py-1 text-[13px] font-semibold text-info-oscuro"
                >
                  {programa}
                </li>
              ))}
            </ul>
          </Seccion>
        )}

        {verContrasenas && (
          <Seccion titulo="Contraseñas" Icono={KeyRound}>
            <ContrasenasEquipo key={ec.idEquipoComputo} equipo={ec} />
          </Seccion>
        )}

        {ec.observaciones && (
          <Seccion titulo="Observaciones" Icono={NotebookPen}>
            <p className="whitespace-pre-line rounded-xl border border-dorado/30 bg-dorado-claro px-4 py-3 text-sm leading-relaxed text-dorado-oscuro">
              {ec.observaciones}
            </p>
          </Seccion>
        )}

        <div className="flex flex-wrap items-end justify-between gap-2 text-[12px] text-outline">
          <p>
            {ec.registradoPor && (
              <span className="block">
                Registrado por {ec.registradoPor}
                {ec.fechaRegistro ? ` el ${formatearFecha(ec.fechaRegistro)}` : ""}
              </span>
            )}
            <span className="block">
              Última actualización: {formatearFecha(ec.fechaActualizacion ?? ec.fechaRegistro)}
              {ec.ultimoUsuarioActualizacionNombre ? ` por ${ec.ultimoUsuarioActualizacionNombre}` : ""}
            </span>
          </p>
          {puedeVerHistorial && (
            <ButtonLink
              href={`/admin/bitacora?inventario=${encodeURIComponent(ec.inventario)}`}
              size="sm"
              variant="ghost"
              icon={<History className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Ver historial
            </ButtonLink>
          )}
        </div>

        {puedeGestionar && (
          <div className="flex flex-wrap justify-end gap-2.5 border-t border-variante pt-4">
            <Button variant="danger-outline" size="sm" icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />} onClick={onEliminar}>
              Eliminar
            </Button>
            <Button size="sm" icon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />} onClick={onEditar}>
              Editar
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

/** Caja de un grupo de datos con título e icono. */
function Seccion({
  titulo,
  Icono,
  resumen,
  children,
}: {
  titulo: string;
  Icono: LucideIcon;
  resumen?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-variante bg-superficie/60 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-verde-oscuro">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-verde text-white">
            <Icono className="h-4 w-4" aria-hidden="true" />
          </span>
          {titulo}
        </h3>
        {resumen}
      </div>
      {children}
    </section>
  );
}

/** Periférico con su estado: verde si está bien, rojo si tiene falla, gris sin dato. */
function FilaPeriferico({ nombre, Icono, valor }: { nombre: string; Icono: LucideIcon; valor: string | null }) {
  const falla = perifericoConFalla(valor);
  const sinDato = !valor;
  return (
    <li className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex items-center gap-3 text-[15px] font-bold">
        <Icono className="h-4.5 w-4.5 text-sobre-variante" aria-hidden="true" />
        {nombre}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold",
          sinDato
            ? "bg-variante text-sobre-variante"
            : falla
              ? "bg-error-claro text-error-oscuro"
              : "bg-verde-claro text-verde-oscuro",
        )}
      >
        {sinDato ? (
          <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
        ) : falla ? (
          <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {valor || "Sin dato"}
      </span>
    </li>
  );
}

/** Dato de hardware en su propia tarjeta: icono, etiqueta arriba y valor en negritas. */
function DatoIcono({ etiqueta, Icono, valor }: { etiqueta: string; Icono: LucideIcon; valor: string | null }) {
  return (
    <div className="flex min-w-0 gap-3.5 rounded-xl border border-variante bg-white px-4 py-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-verde-claro/60 text-verde">
        <Icono className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-sobre-variante">{etiqueta}</dt>
        <dd className={cn("mt-0.5 break-words text-[15px] leading-snug", valor ? "font-bold" : "text-outline")}>
          {valor || "Sin registrar"}
        </dd>
      </div>
    </div>
  );
}

/**
 * Contraseña actual y última contraseña (columnas `contrasena` y
 * `ultima_contrasena`). La respuesta normal solo dice si existen; los valores
 * se piden al pulsar "Mostrar" y esa consulta queda en la bitácora del equipo.
 */
function ContrasenasEquipo({ equipo }: { equipo: EquipoComputo }) {
  const consulta = useMutation({
    mutationFn: () => equipoComputoService.obtenerContrasenas(equipo.idEquipoComputo),
    onError: (err: Error) => toast.error(err.message),
  });
  const datos: ContrasenasEquipo | undefined = consulta.data;
  const hayAlguna = equipo.tieneContrasena || equipo.tieneUltimaContrasena;

  return (
    <div className="flex flex-col gap-2.5">
      <ul className="flex flex-col gap-2">
        <FilaContrasena etiqueta="Contraseña actual" existe={equipo.tieneContrasena} valor={datos?.contrasena ?? null} />
        <FilaContrasena
          etiqueta="Última contraseña"
          existe={equipo.tieneUltimaContrasena}
          valor={datos?.ultimaContrasena ?? null}
        />
      </ul>
      {(datos?.fechaCambioContrasena ?? equipo.fechaCambioContrasena) && (
        <p className="text-[12px] text-sobre-variante">
          Último cambio: {formatearFecha(datos?.fechaCambioContrasena ?? equipo.fechaCambioContrasena)}
        </p>
      )}
      {hayAlguna && !datos && (
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            loading={consulta.isPending}
            icon={<Eye className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={() => consulta.mutate()}
          >
            Mostrar contraseñas
          </Button>
          <span className="text-[12px] text-outline">La consulta queda registrada en la bitácora.</span>
        </div>
      )}
    </div>
  );
}

function FilaContrasena({ etiqueta, existe, valor }: { etiqueta: string; existe: boolean; valor: string | null }) {
  const [visible, setVisible] = useState(true);

  const copiar = async () => {
    if (!valor) return;
    try {
      await navigator.clipboard.writeText(valor);
      toast.success(`${etiqueta} copiada`);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-variante bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-sobre-variante">{etiqueta}</p>
        <p
          className={cn(
            "mt-0.5 truncate font-mono text-sm",
            !existe ? "text-outline" : valor ? "font-bold" : "tracking-widest text-sobre-variante",
          )}
        >
          {!existe ? "Sin registrar" : valor ? (visible ? valor : "••••••••") : "••••••••"}
        </p>
      </div>
      {valor && (
        <span className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? `Ocultar ${etiqueta.toLowerCase()}` : `Mostrar ${etiqueta.toLowerCase()}`}
            className="rounded-md p-1.5 text-sobre-variante hover:bg-variante focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado"
          >
            {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={copiar}
            aria-label={`Copiar ${etiqueta.toLowerCase()}`}
            className="rounded-md p-1.5 text-sobre-variante hover:bg-variante focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </button>
        </span>
      )}
    </li>
  );
}
