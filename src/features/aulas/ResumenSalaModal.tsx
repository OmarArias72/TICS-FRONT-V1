"use client";

import { Modal, StatusBadge } from "@/components/ui";
import { estadoComputadora } from "@/lib/estados";
import type { EquipoComputo, Sala } from "@/types/api";

import { ESTADOS_COMPUTADORA, NOMBRE_PERIFERICO, resumirSala } from "./equipos";

interface ResumenSalaModalProps {
  sala: Sala | null;
  equipos: EquipoComputo[];
  onClose: () => void;
}

/**
 * Resumen de una sala (antes RoomDetailsHubModal.jsx), simplificado por la
 * decisión 2026-10-30: estados, sistemas operativos y periféricos con falla.
 */
export function ResumenSalaModal({ sala, equipos, onClose }: ResumenSalaModalProps) {
  return (
    <Modal
      open={sala !== null}
      onClose={onClose}
      size="lg"
      title={sala ? `Resumen · ${sala.nombre ?? sala.codigoSala}` : "Resumen"}
      description={sala ? [sala.codigoSala, sala.ubicacion].filter(Boolean).join(" · ") : undefined}
    >
      {sala && <Resumen sala={sala} equipos={equipos} />}
    </Modal>
  );
}

function Barra({ valor, total }: { valor: number; total: number }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <span className="h-2 flex-1 overflow-hidden rounded-full bg-variante" aria-hidden="true">
      <span className="block h-full rounded-full bg-verde" style={{ width: `${pct}%` }} />
    </span>
  );
}

function Resumen({ sala, equipos }: { sala: Sala; equipos: EquipoComputo[] }) {
  const { conteo, sistemas, fallas } = resumirSala(equipos);

  if (conteo.total === 0) {
    return <p className="pb-2 text-sm text-sobre-variante">Esta sala aún no tiene equipos registrados.</p>;
  }

  return (
    <div className="flex flex-col gap-6 pb-2">
      {sala.descripcion && <p className="text-sm leading-relaxed text-sobre-variante">{sala.descripcion}</p>}

      <section aria-labelledby="resumen-estados">
        <h3 id="resumen-estados" className="mb-3 text-xs font-extrabold uppercase tracking-[0.08em] text-sobre-variante">
          Estado de los {conteo.total} equipos
        </h3>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {ESTADOS_COMPUTADORA.map((e) => (
            <li key={e} className="flex flex-col items-start gap-2 rounded-xl bg-superficie p-3">
              <span className="text-2xl font-extrabold">{conteo.porEstado[e] ?? 0}</span>
              <StatusBadge {...estadoComputadora(e)} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="resumen-so">
        <h3 id="resumen-so" className="mb-3 text-xs font-extrabold uppercase tracking-[0.08em] text-sobre-variante">
          Sistemas operativos
        </h3>
        <ul className="flex flex-col gap-2">
          {sistemas.map(([so, n]) => (
            <li key={so} className="flex items-center gap-3 text-sm">
              <span className="w-44 shrink-0 truncate font-semibold">{so}</span>
              <Barra valor={n} total={conteo.total} />
              <span className="w-16 shrink-0 text-right text-sobre-variante">
                {n} {n === 1 ? "equipo" : "equipos"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="resumen-fallas">
        <h3 id="resumen-fallas" className="mb-3 text-xs font-extrabold uppercase tracking-[0.08em] text-sobre-variante">
          Periféricos con falla
        </h3>
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {fallas.map(({ periferico, total, detalle }) => (
            <li key={periferico} className="rounded-xl border border-variante p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold">{NOMBRE_PERIFERICO[periferico]}</span>
                <span className={total > 0 ? "font-extrabold text-error" : "text-sobre-variante"}>{total}</span>
              </div>
              {detalle.length > 0 ? (
                <ul className="mt-1.5 flex flex-col gap-0.5 text-[13px] text-sobre-variante">
                  {detalle.map(([falla, n]) => (
                    <li key={falla} className="flex justify-between">
                      <span>{falla}</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[13px] text-sobre-variante">Sin fallas registradas.</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
