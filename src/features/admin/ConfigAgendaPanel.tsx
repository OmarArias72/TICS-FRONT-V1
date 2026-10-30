"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";

/**
 * Interruptor de apertura y cierre de la agenda (antes AdminConfigAgendaPage.jsx).
 *
 * Decisión 2026-10-30: se conserva la pantalla, pero el backend no tiene un
 * endpoint para guardar este estado. El cambio solo es visual y se pierde al
 * recargar; el aviso lo deja explícito para no aparentar que funciona.
 */
export function ConfigAgendaPanel() {
  const [sistemaActivo, setSistemaActivo] = useState(true);

  return (
    <div className="w-full max-w-lg space-y-6 rounded-2xl border border-variante bg-white p-8 text-center shadow-xl shadow-verde-oscuro/5">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-dorado-texto">
          Módulo de Administración
        </span>
        <h1 className="mt-1 text-2xl font-extrabold text-sobre-superficie">Control de Agenda</h1>
        <p className="mt-1 text-sm text-sobre-variante">
          Habilita o inactiva las reservas de salas para usuarios finales.
        </p>
      </div>

      <div
        role="note"
        className="flex items-start gap-3 rounded-xl border border-alerta/30 bg-alerta-claro p-4 text-left"
      >
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-alerta" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold text-alerta-oscuro">Pendiente de backend</p>
          <p className="text-xs text-alerta-oscuro/80">
            Este interruptor todavía no se guarda en el servidor: el cambio no afecta a las reservas
            y se pierde al recargar la página.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-variante bg-superficie p-5">
        <div className="text-left">
          <span id="estado-agenda" className="block text-sm font-bold text-sobre-superficie">
            {sistemaActivo ? "Módulo Activo" : "Módulo Inactivo"}
          </span>
          <span className="text-xs text-sobre-variante">
            {sistemaActivo ? "Los usuarios pueden agendar salas." : "Se han pausado nuevas agendas."}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={sistemaActivo}
          aria-labelledby="estado-agenda"
          onClick={() => setSistemaActivo((v) => !v)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado focus-visible:ring-offset-2 ${
            sistemaActivo ? "bg-verde" : "bg-outline/50"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              sistemaActivo ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
