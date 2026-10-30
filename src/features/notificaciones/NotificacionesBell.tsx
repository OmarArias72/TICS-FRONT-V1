"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";

import { FUNCIONES_BACKEND } from "@/lib/api/funcionesBackend";
import { notificacionService } from "@/lib/api/services";
import { cn } from "@/lib/cn";
import { formatearFecha } from "@/lib/fechas";
import type { Notificacion } from "@/types/api";

/** Cada cuánto se consultan notificaciones nuevas (el backend no tiene push). */
const INTERVALO_MS = 60_000;

const claveNotificaciones = (idUsuario: number) => ["notificaciones", idUsuario] as const;

/**
 * Campana de notificaciones en la barra superior (decisión 2026-10-30).
 * Avisa, entre otros, cuando el admin reasigna o cancela una reserva o pide un
 * cambio al profesor. Depende de FUNCIONES_BACKEND.notificaciones.
 */
export function NotificacionesBell({ idUsuario }: { idUsuario: number }) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const disponible = FUNCIONES_BACKEND.notificaciones;

  const query = useQuery({
    queryKey: claveNotificaciones(idUsuario),
    queryFn: () => notificacionService.listar(idUsuario),
    enabled: disponible,
    refetchInterval: INTERVALO_MS,
  });
  const notificaciones = query.data ?? [];
  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const refrescar = () => void queryClient.invalidateQueries({ queryKey: claveNotificaciones(idUsuario) });
  const marcarLeida = useMutation({
    mutationFn: (id: number) => notificacionService.marcarLeida(id, idUsuario),
    onSuccess: refrescar,
  });
  const marcarTodas = useMutation({
    mutationFn: () => notificacionService.marcarTodasLeidas(idUsuario),
    onSuccess: refrescar,
  });

  // Cerrar con Escape o con un clic fuera del panel.
  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [abierto]);

  const abrirNotificacion = (n: Notificacion) => {
    if (!n.leida) marcarLeida.mutate(n.idNotificacion);
    setAbierto(false);
    if (n.enlace) router.push(n.enlace);
  };

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
        aria-expanded={abierto}
        aria-controls="panel-notificaciones"
        className="relative rounded-xl p-2 text-verde-claro transition-colors hover:bg-verde hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {noLeidas > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-dorado px-1 text-[10px] font-extrabold text-dorado-oscuro"
            aria-hidden="true"
          >
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          id="panel-notificaciones"
          role="region"
          aria-label="Notificaciones"
          className="absolute right-0 top-12 z-50 flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-variante bg-white text-sobre-superficie shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-variante px-4 py-3">
            <h2 className="text-sm font-extrabold">Notificaciones</h2>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={() => marcarTodas.mutate()}
                disabled={marcarTodas.isPending}
                className="flex items-center gap-1 text-xs font-bold text-verde hover:text-dorado-texto disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {!disponible ? (
              <p className="px-4 py-6 text-center text-sm text-sobre-variante">
                <span className="block font-bold text-sobre-superficie">Pendiente de backend</span>
                El servidor todavía no envía notificaciones.
              </p>
            ) : query.isPending ? (
              <p className="px-4 py-6 text-center text-sm text-sobre-variante">Cargando...</p>
            ) : query.isError ? (
              <p className="px-4 py-6 text-center text-sm text-error">{query.error.message}</p>
            ) : notificaciones.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-sobre-variante">No tienes notificaciones.</p>
            ) : (
              <ul className="divide-y divide-variante">
                {notificaciones.map((n) => (
                  <li key={n.idNotificacion}>
                    <button
                      type="button"
                      onClick={() => abrirNotificacion(n)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-superficie",
                        !n.leida && "bg-verde-claro/25",
                      )}
                    >
                      <span
                        className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.leida ? "bg-transparent" : "bg-dorado")}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">
                          {n.titulo}
                          {!n.leida && <span className="sr-only"> (sin leer)</span>}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-sobre-variante">{n.mensaje}</span>
                        <span className="mt-1 block text-[11px] text-outline">{formatearFecha(n.fechaCreacion)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
