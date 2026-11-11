"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CalendarClock, CheckCheck, LifeBuoy, Mail, X } from "lucide-react";

import { FUNCIONES_BACKEND } from "@/lib/api/funcionesBackend";
import { notificacionService } from "@/lib/api/services";
import { cn } from "@/lib/cn";
import { formatearFechaHora } from "@/lib/fechas";
import type { Notificacion } from "@/types/api";

/** Cada cuánto se consulta el contador (el backend no tiene push). */
const INTERVALO_MS = 60_000;
/** Cuántas notificaciones se muestran al abrir la campana. */
const LIMITE_LISTA = 30;

const claves = {
  todo: (idUsuario: number) => ["notificaciones", idUsuario] as const,
  conteo: (idUsuario: number) => ["notificaciones", idUsuario, "conteo"] as const,
  lista: (idUsuario: number) => ["notificaciones", idUsuario, "lista"] as const,
};

/**
 * Prefijos de las consultas que una notificación puede dejar viejas (reservas, cambios,
 * solicitudes de sala y de la mesa de ayuda). Se escriben aquí para no importar las
 * claves de cada módulo en la barra superior.
 */
const PANTALLAS_CON_AVISOS = [
  ["mis-reservas"],
  ["agenda"],
  ["mis-solicitudes"],
  ["solicitudes-pendientes"],
  ["solicitudes-cambio"],
  ["mis-solicitudes-tecnicas"],
  ["panel-mesa-ayuda"],
] as const;

function refrescarPantallas(queryClient: ReturnType<typeof useQueryClient>) {
  for (const queryKey of PANTALLAS_CON_AVISOS) void queryClient.invalidateQueries({ queryKey });
}

/** Icono según el grupo del tipo (reservas, mesa de ayuda o buzón). */
function IconoTipo({ tipo }: { tipo: string }) {
  const clase = "mt-0.5 h-4 w-4 shrink-0 text-verde";
  if (tipo === "CORREO_SIN_TICKET") return <Mail className={clase} aria-hidden="true" />;
  if (tipo.startsWith("SOLICITUD_TECNICA") || tipo.startsWith("TICKET")) {
    return <LifeBuoy className={clase} aria-hidden="true" />;
  }
  return <CalendarClock className={clase} aria-hidden="true" />;
}

/**
 * Campana de notificaciones en la barra superior (backend v4.1).
 *
 * - Cada 60 s (y al volver a la pestaña) consulta solo `GET /notificaciones/conteo`.
 * - La lista (`GET /notificaciones`) se pide al abrir el panel.
 * - Al hacer clic se marca como leída y se navega a su `enlace`.
 */
export function NotificacionesBell({ idUsuario }: { idUsuario: number }) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const disponible = FUNCIONES_BACKEND.notificaciones;

  const conteo = useQuery({
    queryKey: claves.conteo(idUsuario),
    queryFn: notificacionService.conteo,
    enabled: disponible,
    refetchInterval: INTERVALO_MS,
    refetchOnWindowFocus: true,
  });

  const query = useQuery({
    queryKey: claves.lista(idUsuario),
    queryFn: () => notificacionService.listar(LIMITE_LISTA),
    enabled: disponible && abierto,
    staleTime: 0,
  });
  const notificaciones = query.data?.notificaciones ?? [];
  // El total sale del servidor: la lista solo trae las 30 más recientes.
  const noLeidas = (abierto ? query.data?.noLeidas : undefined) ?? conteo.data?.noLeidas ?? 0;

  // Si el contador sube mientras el panel está abierto, se recarga la lista. Y si sube en
  // cualquier momento, llegó un aviso (cambio de reserva, ticket, etc.): se recargan las
  // pantallas que podrían mostrar ese cambio, sin que el usuario tenga que refrescar.
  const ultimoConteo = useRef<number | undefined>(undefined);
  useEffect(() => {
    const actual = conteo.data?.noLeidas;
    const anterior = ultimoConteo.current;
    if (anterior !== undefined && actual !== undefined && actual !== anterior) {
      if (abierto) void queryClient.invalidateQueries({ queryKey: claves.lista(idUsuario) });
      if (actual > anterior) refrescarPantallas(queryClient);
    }
    ultimoConteo.current = actual;
  }, [conteo.data?.noLeidas, abierto, idUsuario, queryClient]);

  const refrescar = () => void queryClient.invalidateQueries({ queryKey: claves.todo(idUsuario) });
  const marcarLeida = useMutation({
    mutationFn: (id: number) => notificacionService.marcarLeida(id),
    onSuccess: refrescar,
  });
  const marcarTodas = useMutation({
    mutationFn: () => notificacionService.marcarTodasLeidas(),
    onSuccess: refrescar,
  });
  const eliminar = useMutation({
    mutationFn: (id: number) => notificacionService.eliminar(id),
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
    // Si ya estaba en esa página, router.push no vuelve a pedir los datos
    refrescarPantallas(queryClient);
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
            {noLeidas > 99 ? "99+" : noLeidas}
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
                  <li key={n.idNotificacion} className="group relative">
                    <button
                      type="button"
                      onClick={() => abrirNotificacion(n)}
                      className={cn(
                        "flex w-full gap-3 py-3 pl-4 pr-10 text-left transition-colors hover:bg-superficie",
                        !n.leida && "bg-verde-claro/25",
                      )}
                    >
                      <span
                        className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.leida ? "bg-transparent" : "bg-dorado")}
                        aria-hidden="true"
                      />
                      <IconoTipo tipo={n.tipo} />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">
                          {n.titulo}
                          {!n.leida && <span className="sr-only"> (sin leer)</span>}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-sobre-variante">{n.mensaje}</span>
                        <span className="mt-1 block text-[11px] text-outline">{formatearFechaHora(n.fechaCreacion)}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar.mutate(n.idNotificacion)}
                      disabled={eliminar.isPending && eliminar.variables === n.idNotificacion}
                      aria-label={`Quitar la notificación "${n.titulo}"`}
                      className="absolute right-2 top-2.5 rounded-lg p-1.5 text-outline opacity-100 transition-opacity hover:bg-variante hover:text-sobre-superficie focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
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
