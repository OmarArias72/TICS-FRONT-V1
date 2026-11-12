"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, Download, Inbox, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  Alert,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  FormField,
  IconButton,
  Input,
  Modal,
  Select,
  StatusBadge,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableMessage,
  Textarea,
} from "@/components/ui";
import {
  estadoComputadora,
  estadoEquipo,
  estadoSolicitudReserva,
  estadoSolicitudTecnica,
  estadoUsoSala,
} from "@/lib/estados";
import type { EstadoSolicitudTecnica } from "@/types/api";

const ESTADOS_TICKET: EstadoSolicitudTecnica[] = [
  "PENDIENTE",
  "APROBADA",
  "FORMULARIO_ENVIADO",
  "ESPERA_TICKET",
  "TICKET_CREADO",
  "CERRADA",
  "RECHAZADA",
  "CANCELADA",
];

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.06em] text-dorado-texto">{titulo}</h2>
      {children}
    </Card>
  );
}

/** Catálogo de componentes para revisarlos durante el desarrollo. */
export function ComponentShowcase() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmAbierto, setConfirmAbierto] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const simularEliminar = () => {
    setEliminando(true);
    setTimeout(() => {
      setEliminando(false);
      setConfirmAbierto(false);
      toast.success("Equipo eliminado (simulación)");
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Seccion titulo="Botones">
        <div className="flex flex-wrap gap-3">
          <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />}>Nuevo equipo</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="accent" icon={<Download className="h-4 w-4" aria-hidden="true" />}>
            Descargar PDF
          </Button>
          <Button variant="danger">Eliminar</Button>
          <Button variant="danger-outline">Rechazar</Button>
          <Button loading>Guardando</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <IconButton label="Editar" icon={<Pencil className="h-4 w-4" aria-hidden="true" />} />
          <IconButton
            label="Eliminar"
            tone="danger"
            icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
          />
          <Button variant="ghost" size="sm" icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}>
            Ver conteos
          </Button>
        </div>
      </Seccion>

      <Seccion titulo="Etiquetas de estado">
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-36 font-semibold text-sobre-variante">Inventario</span>
            {(["ALTA", "MANTENIMIENTO", "BAJA"] as const).map((e) => (
              <StatusBadge key={e} {...estadoEquipo(e)} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-36 font-semibold text-sobre-variante">Equipo de cómputo</span>
            {(["Funcionando", "Requiere revisión", "Requiere Mantenimiento", "No funciona"] as const).map(
              (e) => (
                <StatusBadge key={e} {...estadoComputadora(e)} />
              ),
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-36 font-semibold text-sobre-variante">Reservas</span>
            <StatusBadge {...estadoSolicitudReserva("Pendiente")} />
            <StatusBadge {...estadoUsoSala("Confirmada")} />
            <StatusBadge {...estadoSolicitudReserva("Rechazada")} />
            <StatusBadge {...estadoUsoSala("Cancelada")} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-36 font-semibold text-sobre-variante">Mesa de ayuda</span>
            {ESTADOS_TICKET.map((e) => (
              <StatusBadge key={e} {...estadoSolicitudTecnica(e)} />
            ))}
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Campos de formulario">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="No. de inventario" required>
            {(a11y) => <Input {...a11y} defaultValue="INV-2026-006" />}
          </FormField>
          <FormField label="Estado">
            {(a11y) => (
              <Select {...a11y} defaultValue="ALTA">
                <option>ALTA</option>
                <option>MANTENIMIENTO</option>
              </Select>
            )}
          </FormField>
          <FormField label="CURP" error="El formato de la CURP es inválido." className="sm:col-span-2">
            {(a11y) => <Input {...a11y} defaultValue="PELJ01023" />}
          </FormField>
          <FormField
            label="Descripción del problema"
            hint="Explica brevemente qué ocurre."
            className="sm:col-span-2"
          >
            {(a11y) => <Textarea {...a11y} />}
          </FormField>
        </div>
      </Seccion>

      <Seccion titulo="Avisos y notificaciones">
        <Alert tone="alerta" title="Pendiente de backend.">
          Este cambio aún no se guarda en el servidor.
        </Alert>
        <Alert tone="info">
          Puedes tener hasta 3 solicitudes activas y enviar una del mismo tipo cada 24 horas.
        </Alert>
        <Alert tone="error" title="No se pudo cargar la agenda." />
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={() => toast.success("Reserva registrada")}>
            Aviso de éxito
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast.error("Credenciales incorrectas")}>
            Aviso de error
          </Button>
        </div>
      </Seccion>

      <Card className="overflow-hidden lg:col-span-2">
        <CardHeader title="Tabla" description="Con fila de carga y de lista vacía." />
        <Table minWidth={560}>
          <THead>
            <tr>
              <TH>Inventario</TH>
              <TH>Artículo</TH>
              <TH>Estado</TH>
              <TH className="text-right">Acciones</TH>
            </tr>
          </THead>
          <tbody>
            <TR>
              <TD className="font-bold">INV-2026-001</TD>
              <TD>LAPTOP</TD>
              <TD>
                <StatusBadge {...estadoEquipo("ALTA")} />
              </TD>
              <TD>
                <div className="flex justify-end gap-2">
                  <IconButton
                    label="Editar INV-2026-001"
                    size="sm"
                    icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                  />
                </div>
              </TD>
            </TR>
            <TableMessage colSpan={4} loading>
              Cargando inventario...
            </TableMessage>
            <TableMessage colSpan={4}>No se encontraron equipos con estos criterios.</TableMessage>
          </tbody>
        </Table>
      </Card>

      <Seccion titulo="Modales">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setModalAbierto(true)}>Abrir formulario</Button>
          <Button variant="danger-outline" onClick={() => setConfirmAbierto(true)}>
            Abrir confirmación
          </Button>
        </div>
      </Seccion>

      <Seccion titulo="Lista vacía">
        <EmptyState
          icon={<Inbox className="h-8 w-8" aria-hidden="true" />}
          title="No tienes solicitudes registradas"
          description='Usa "Nueva solicitud" si necesitas asistencia.'
          action={<Button size="sm">Nueva solicitud</Button>}
        />
      </Seccion>

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title="Nuevo equipo"
        description="Registra un equipo en el inventario."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setModalAbierto(false)}>Guardar</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="No. de inventario" required>
            {(a11y) => <Input {...a11y} />}
          </FormField>
          <FormField label="Número de serie">{(a11y) => <Input {...a11y} />}</FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmAbierto}
        onClose={() => setConfirmAbierto(false)}
        onConfirm={simularEliminar}
        loading={eliminando}
        title="¿Eliminar INV-2026-004?"
        description="El equipo se quitará del inventario. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </div>
  );
}
