import type {
  EstadoComputadora,
  EstadoEquipo,
  EstadoSolicitudReserva,
  EstadoSolicitudTecnica,
  EstadoUsoSala,
} from "@/types/api";

/**
 * Tonos de color de las etiquetas de estado (prototipo aprobado 2026-10-30).
 * El mismo significado usa el mismo color en todos los módulos:
 * - ok: correcto o confirmado
 * - alerta: pendiente o en mantenimiento
 * - error: rechazado, dañado o dado de baja
 * - info: requiere una acción del usuario o revisión
 * - dorado: en proceso por parte de TICS
 * - neutro: cancelado o sin efecto
 */
export type Tono = "ok" | "alerta" | "error" | "info" | "dorado" | "neutro";

export interface EstadoVisual {
  tono: Tono;
  etiqueta: string;
}

const desconocido = (valor: string | null | undefined): EstadoVisual => ({
  tono: "neutro",
  etiqueta: valor || "Sin estado",
});

/** Estado administrativo del inventario (ALTA, MANTENIMIENTO, BAJA). */
export function estadoEquipo(estado: EstadoEquipo | null | undefined): EstadoVisual {
  switch (estado) {
    case "ALTA":
      return { tono: "ok", etiqueta: "ALTA" };
    case "MANTENIMIENTO":
      return { tono: "alerta", etiqueta: "MANTENIMIENTO" };
    case "BAJA":
      return { tono: "error", etiqueta: "BAJA" };
    default:
      return desconocido(estado);
  }
}

/** Estado físico de un equipo de cómputo en el mapa de aulas. */
export function estadoComputadora(estado: EstadoComputadora | null | undefined): EstadoVisual {
  switch (estado) {
    case "Funcionando":
      return { tono: "ok", etiqueta: "Funcionando" };
    case "Requiere revisión":
      return { tono: "info", etiqueta: "Requiere revisión" };
    case "Requiere Mantenimiento":
      return { tono: "alerta", etiqueta: "Requiere mantenimiento" };
    case "No funciona":
      return { tono: "error", etiqueta: "No funciona" };
    default:
      return desconocido(estado);
  }
}

/** Estado de un uso de sala en la agenda. */
export function estadoUsoSala(estado: EstadoUsoSala | null | undefined): EstadoVisual {
  switch (estado) {
    case "Confirmada":
      return { tono: "ok", etiqueta: "Confirmada" };
    case "Cancelada":
      return { tono: "neutro", etiqueta: "Cancelada" };
    default:
      return desconocido(estado);
  }
}

/** Estado de una solicitud extraordinaria de reserva. */
export function estadoSolicitudReserva(
  estado: EstadoSolicitudReserva | null | undefined,
): EstadoVisual {
  switch (estado) {
    case "Pendiente":
      return { tono: "alerta", etiqueta: "Pendiente" };
    case "Aprobada":
      return { tono: "ok", etiqueta: "Aprobada" };
    case "Rechazada":
      return { tono: "error", etiqueta: "Rechazada" };
    default:
      return desconocido(estado);
  }
}

/** Estado de una solicitud de la mesa de ayuda, con el texto que ve el usuario. */
export function estadoSolicitudTecnica(estado: EstadoSolicitudTecnica): EstadoVisual {
  const mapa: Record<EstadoSolicitudTecnica, EstadoVisual> = {
    PENDIENTE: { tono: "alerta", etiqueta: "Pendiente de revisión" },
    APROBADA: { tono: "info", etiqueta: "Llena tus datos" },
    FORMULARIO_ENVIADO: { tono: "info", etiqueta: "Datos enviados" },
    ESPERA_TICKET: { tono: "dorado", etiqueta: "En proceso en TICS" },
    TICKET_CREADO: { tono: "dorado", etiqueta: "Ticket generado" },
    RESUELTO: { tono: "ok", etiqueta: "Resuelto por TICS" },
    CERRADA: { tono: "ok", etiqueta: "Cerrada" },
    RECHAZADA: { tono: "error", etiqueta: "Rechazada" },
    CANCELADA: { tono: "neutro", etiqueta: "Cancelada" },
  };
  return mapa[estado] ?? desconocido(estado);
}
