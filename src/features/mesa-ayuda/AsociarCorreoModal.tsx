"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { Alert, Button, FormField, Modal, Select } from "@/components/ui";
import { solicitudTecnicaService } from "@/lib/api/services";
import { formatearFecha } from "@/lib/fechas";
import type { CorreoBuzon } from "@/types/api";

import { clavesMesaAyuda } from "./claves";
import { nombreTipo } from "./flujo";

/** Estados en los que una solicitud puede recibir su ticket (igual que el backend). */
const LISTAS_PARA_TICKET = ["FORMULARIO_ENVIADO", "ESPERA_TICKET"];

/**
 * Asocia un correo "Sin asociar" (ticket de ServiceDesk que ninguna solicitud
 * tiene) a una solicitud lista para ticket. El backend le asigna el ticket y
 * aplica en orden todos los correos pendientes de ese ticket.
 */
export function AsociarCorreoModal({
  correo,
  onClose,
  onAsociado,
}: {
  correo: CorreoBuzon | null;
  onClose: () => void;
  onAsociado: (idSolicitud: number) => void;
}) {
  return (
    <Modal
      open={correo !== null}
      onClose={onClose}
      title="Asociar ticket a una solicitud"
      description={correo ? `${correo.codigoTicket ?? ""}${correo.tituloTicket ? ` · ${correo.tituloTicket}` : ""}` : undefined}
      icon={<Link2 className="h-5 w-5" aria-hidden="true" />}
    >
      {correo && <Formulario key={correo.idCorreo} correo={correo} onClose={onClose} onAsociado={onAsociado} />}
    </Modal>
  );
}

function Formulario({
  correo,
  onClose,
  onAsociado,
}: {
  correo: CorreoBuzon;
  onClose: () => void;
  onAsociado: (idSolicitud: number) => void;
}) {
  const queryClient = useQueryClient();
  const [idSolicitud, setIdSolicitud] = useState("");
  const panel = useQuery({ queryKey: clavesMesaAyuda.panel, queryFn: () => solicitudTecnicaService.panelAdmin("TODAS") });
  const candidatas = (panel.data ?? [])
    .filter((s) => LISTAS_PARA_TICKET.includes(s.estado) && !s.ticket?.codigoTicketCreado)
    .sort((a, b) => a.fechaSolicitud.localeCompare(b.fechaSolicitud));

  const asociar = useMutation({
    mutationFn: () => solicitudTecnicaService.asociarCorreo(correo.idCorreo, Number(idSolicitud)),
    onSuccess: (r) => {
      toast.success(`Ticket ${r.codigoTicket} asociado a la solicitud #${r.idSolicitud} (${r.correosAplicados} correo(s) aplicados)`);
      void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.buzon() });
      void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.estadoBuzon });
      void queryClient.invalidateQueries({ queryKey: clavesMesaAyuda.panel });
      onClose();
      onAsociado(r.idSolicitud);
    },
    onError: (err: Error) => toast.error(err.message, { duration: 6000 }),
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (idSolicitud) asociar.mutate();
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-sobre-variante">
        Elige la solicitud a la que corresponde este ticket. Solo aparecen las que ya tienen el formulario enviado y aún no
        tienen ticket. Si es de otra área o no corresponde a la mesa de ayuda, ciérralo y usa “Descartar”.
      </p>
      {panel.isError ? (
        <Alert tone="error">{panel.error.message}</Alert>
      ) : candidatas.length === 0 && !panel.isPending ? (
        <Alert tone="alerta">No hay solicitudes esperando ticket. Si la solicitud aún no tiene el formulario, espera a que el solicitante lo envíe.</Alert>
      ) : (
        <FormField label="Solicitud" required>
          {(a11y) => (
            <Select {...a11y} value={idSolicitud} onChange={(e) => setIdSolicitud(e.target.value)} disabled={panel.isPending}>
              <option value="">{panel.isPending ? "Cargando..." : "Elige una solicitud"}</option>
              {candidatas.map((s) => (
                <option key={s.idSolicitud} value={String(s.idSolicitud)}>
                  #{s.idSolicitud} · {nombreTipo(s.tipoNombre)} · {s.nombreUsuario} · {formatearFecha(s.fechaSolicitud)}
                  {s.atendidoPor ? ` · tomada por ${s.atendidoPor}` : ""}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      )}
      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={asociar.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={asociar.isPending} disabled={!idSolicitud} icon={<Link2 className="h-4 w-4" aria-hidden="true" />}>
          Asociar
        </Button>
      </div>
    </form>
  );
}
