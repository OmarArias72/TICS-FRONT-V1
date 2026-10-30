"use client";

import { useState, type ReactNode } from "react";
import { Copy, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button, Card, StatusBadge } from "@/components/ui";
import { usePermiso } from "@/features/auth/usePermiso";
import { cn } from "@/lib/cn";
import { estadoComputadora, estadoEquipo } from "@/lib/estados";
import { formatearFecha } from "@/lib/fechas";
import type { EquipoComputo } from "@/types/api";

import { NOMBRE_PERIFERICO, estadoPc, perifericoConFalla, valorPeriferico, type Periferico } from "./equipos";

const PERIFERICOS: Periferico[] = ["cpu", "monitor", "teclado", "mouse", "ethernet"];

interface EquipoDetalleProps {
  equipo: EquipoComputo;
  onEditar: () => void;
  onEliminar: () => void;
}

/** Panel lateral con el detalle de una PC (antes ComputerDetails.jsx). */
export function EquipoDetalle({ equipo: ec, onEditar, onEliminar }: EquipoDetalleProps) {
  const puedeGestionar = usePermiso("equipos.gestionar");
  const verContrasenas = usePermiso("equipos.verContrasenas");
  const e = ec.equipo;

  const contrasenas = [
    { etiqueta: "Usuario", valor: ec.contrasena },
    { etiqueta: "Administrador", valor: ec.passwordAdmin },
    { etiqueta: "Anterior", valor: ec.lastPassword },
  ].filter((c) => c.valor);

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold tracking-[0.06em] text-dorado-texto">{e.articulo.nombreArticulo}</p>
          <h2 className="mt-0.5 break-all text-lg font-extrabold">{e.inventario}</h2>
          <p className="text-[13px] text-sobre-variante">
            {e.modelo.marca.nombreMarca} {e.modelo.nombreModelo}
            {e.serie ? ` · Serie ${e.serie}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge {...estadoComputadora(estadoPc(ec))} />
          <StatusBadge {...estadoEquipo(e.estado)} />
        </div>
      </div>

      <Bloque titulo="Periféricos">
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PERIFERICOS.map((p) => {
            const valor = valorPeriferico(ec, p);
            const falla = perifericoConFalla(valor);
            return (
              <li
                key={p}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm",
                  falla ? "bg-error-claro text-error-oscuro" : "bg-superficie",
                )}
              >
                <span className="font-bold">{NOMBRE_PERIFERICO[p]}</span>
                <span className={falla ? "font-semibold" : "text-sobre-variante"}>{valor || "Sin dato"}</span>
              </li>
            );
          })}
        </ul>
      </Bloque>

      <Bloque titulo="Hardware y software">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Dato etiqueta="Procesador">{ec.procesador}</Dato>
          <Dato etiqueta="RAM">{ec.ram}</Dato>
          <Dato etiqueta="Almacenamiento">{ec.almacenamiento}</Dato>
          <Dato etiqueta="Sistema operativo">{ec.sistemaOperativo}</Dato>
          {ec.especificacionesHardware && (
            <Dato etiqueta="Otras especificaciones" ancho>
              {ec.especificacionesHardware}
            </Dato>
          )}
          {ec.softwareInstalado && (
            <Dato etiqueta="Software instalado" ancho>
              {ec.softwareInstalado}
            </Dato>
          )}
        </dl>
      </Bloque>

      {verContrasenas && contrasenas.length > 0 && (
        <Bloque titulo="Contraseñas">
          <ul className="flex flex-col gap-2">
            {contrasenas.map((c) => (
              <ContrasenaOculta key={c.etiqueta} etiqueta={c.etiqueta} valor={c.valor!} />
            ))}
          </ul>
        </Bloque>
      )}

      {ec.observaciones && (
        <Bloque titulo="Observaciones">
          <p className="whitespace-pre-line rounded-xl bg-superficie px-4 py-3 text-sm leading-relaxed text-sobre-variante">
            {ec.observaciones}
          </p>
        </Bloque>
      )}

      <p className="text-[12px] text-outline">Última actualización: {formatearFecha(ec.fechaActualizacion ?? ec.fechaRegistro)}</p>

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
    </Card>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-xs font-extrabold uppercase tracking-[0.08em] text-sobre-variante">{titulo}</h3>
      {children}
    </section>
  );
}

function Dato({ etiqueta, children, ancho = false }: { etiqueta: string; children: ReactNode; ancho?: boolean }) {
  return (
    <div className={cn("min-w-0", ancho && "sm:col-span-2")}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-sobre-variante">{etiqueta}</dt>
      <dd className="mt-0.5 whitespace-pre-line break-words font-semibold">{children || "—"}</dd>
    </div>
  );
}

/** Contraseña en puntos, con botones para mostrarla y copiarla (decisión 2026-10-30). */
function ContrasenaOculta({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const [visible, setVisible] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
      toast.success(`Contraseña de ${etiqueta.toLowerCase()} copiada`);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <li className="flex items-center justify-between gap-2 rounded-xl bg-superficie px-3 py-2 text-sm">
      <span className="font-bold">{etiqueta}</span>
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate font-mono">{visible ? valor : "••••••••"}</span>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Ocultar contraseña de ${etiqueta}` : `Mostrar contraseña de ${etiqueta}`}
          className="rounded-md p-1 text-sobre-variante hover:bg-variante focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={copiar}
          aria-label={`Copiar contraseña de ${etiqueta}`}
          className="rounded-md p-1 text-sobre-variante hover:bg-variante focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}
