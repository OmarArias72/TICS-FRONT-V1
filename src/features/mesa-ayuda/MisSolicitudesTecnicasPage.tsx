"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight, Inbox, Plus } from "lucide-react";

import {
  Alert,
  Button,
  Card,
  EmptyState,
  PageContainer,
  PageHeader,
  PageLoader,
  StatusBadge,
} from "@/components/ui";
import { solicitudTecnicaService } from "@/lib/api/services";
import { estadoSolicitudTecnica } from "@/lib/estados";
import { formatearFecha } from "@/lib/fechas";
import { useAuthStore } from "@/store/authStore";
import type { SolicitudTecnica } from "@/types/api";

import { clavesMesaAyuda } from "./claves";
import { CrearSolicitudModal } from "./CrearSolicitudModal";
import { DetalleSolicitudModal } from "./DetalleSolicitudModal";
import { ESTADOS_ACTIVOS, MAX_SOLICITUDES_ACTIVAS, nombreTipo } from "./flujo";
import { ProgresoSolicitud } from "./ProgresoSolicitud";

/**
 * Mesa de Ayuda para Estudiante y Profesor (antes MisSolicitudesTecnicasPage.jsx).
 * Permiso: "mesaAyuda.solicitar".
 */
export function MisSolicitudesTecnicasPage() {
  const idUsuario = useAuthStore((s) => s.user?.idUsuario);
  const [creando, setCreando] = useState(false);
  const [idSeleccionada, setIdSeleccionada] = useState<number | null>(null);

  const query = useQuery({
    queryKey: clavesMesaAyuda.misSolicitudes(idUsuario),
    queryFn: () => solicitudTecnicaService.misSolicitudes(idUsuario!),
    enabled: idUsuario !== undefined,
  });
  const solicitudes = [...(query.data ?? [])].sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));
  // Se busca por id en los datos frescos para que el detalle refleje cambios.
  const seleccionada = solicitudes.find((s) => s.idSolicitud === idSeleccionada) ?? null;
  const activas = solicitudes.filter((s) => ESTADOS_ACTIVOS.includes(s.estado)).length;
  const limiteAlcanzado = activas >= MAX_SOLICITUDES_ACTIVAS;

  if (idUsuario === undefined) return null;

  return (
    <PageContainer narrow>
      <PageHeader
        eyebrow="Mesa de Ayuda"
        title="Mis solicitudes técnicas"
        description="Contraseña de correo, autenticador u otro problema con los servicios TIC."
        actions={
          <Button
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setCreando(true)}
            disabled={limiteAlcanzado}
          >
            Nueva solicitud
          </Button>
        }
      />

      <Alert tone={limiteAlcanzado ? "alerta" : "neutro"}>
        {limiteAlcanzado
          ? `Tienes ${activas} solicitudes activas, el máximo permitido. Podrás enviar otra cuando alguna termine.`
          : `Puedes tener hasta ${MAX_SOLICITUDES_ACTIVAS} solicitudes activas y enviar una del mismo tipo cada 24 horas.`}
      </Alert>

      {query.isPending ? (
        <PageLoader label="Cargando solicitudes..." />
      ) : query.isError ? (
        <Alert tone="error">{query.error.message}</Alert>
      ) : solicitudes.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-8 w-8" aria-hidden="true" />}
          title="No tienes solicitudes registradas"
          description='Usa "Nueva solicitud" si necesitas ayuda de TICS.'
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {solicitudes.map((s) => (
            <li key={s.idSolicitud}>
              <TarjetaSolicitud solicitud={s} onVer={() => setIdSeleccionada(s.idSolicitud)} />
            </li>
          ))}
        </ul>
      )}

      <CrearSolicitudModal open={creando} onClose={() => setCreando(false)} idUsuario={idUsuario} />
      <DetalleSolicitudModal solicitud={seleccionada} idUsuario={idUsuario} onClose={() => setIdSeleccionada(null)} />
    </PageContainer>
  );
}

function TarjetaSolicitud({ solicitud: s, onVer }: { solicitud: SolicitudTecnica; onVer: () => void }) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:px-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold tracking-[0.06em] text-dorado-texto">
            Solicitud #{s.idSolicitud} · {nombreTipo(s.tipoNombre)}
          </p>
          <p className="mt-1 text-[17px] font-extrabold">{s.motivo || nombreTipo(s.tipoNombre)}</p>
          <p className="mt-0.5 text-[13px] text-sobre-variante">Enviada el {formatearFecha(s.fechaSolicitud)}</p>
        </div>
        <StatusBadge {...estadoSolicitudTecnica(s.estado)} className="self-start" />
      </div>

      <ProgresoSolicitud estado={s.estado} />

      {s.estado === "APROBADA" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-info-claro px-4 py-3.5 text-info-oscuro">
          <span className="text-sm font-semibold">TICS aprobó tu solicitud. Completa tus datos para generar el ticket.</span>
          <Button size="sm" onClick={onVer} icon={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}>
            Llenar formulario
          </Button>
        </div>
      ) : (
        <>
          {s.estado === "TICKET_CREADO" && (
            <p className="rounded-xl bg-dorado-claro px-4 py-3.5 text-sm font-semibold text-dorado-oscuro">
              TICS ya generó el ticket en la plataforma externa. Te avisaremos cuando quede resuelto.
            </p>
          )}
          {s.estado === "RECHAZADA" && (
            <p className="rounded-xl bg-error-claro px-4 py-3.5 text-sm text-error-oscuro">
              <span className="font-bold">Rechazada:</span> {s.motivoRechazo ?? "sin motivo registrado"}. Puedes
              reenviarla con más información.
            </p>
          )}
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={onVer}
              icon={<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Ver detalle
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
