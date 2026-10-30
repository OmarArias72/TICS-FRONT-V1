import type { EstadoSolicitudTecnica, TipoSolicitud } from "@/types/api";

/**
 * Flujo de una solicitud técnica, tal como lo aplica el backend:
 *
 * PENDIENTE -> (TICS aprueba) APROBADA -> (solicitante llena sus datos)
 * FORMULARIO_ENVIADO -> (TICS la toma) ESPERA_TICKET -> (TICS captura el
 * ticket de ServiceDesk) TICKET_CREADO -> (TICS lo resuelve) CERRADA.
 *
 * Ramas: RECHAZADA (se puede reenviar) y CANCELADA (por el solicitante,
 * solo antes de que TICS la tome).
 *
 * Decisión 2026-10-30: al resolverse, la solicitud queda cerrada sin que el
 * solicitante confirme; RESUELTO no se usa en el flujo actual.
 */

export const PASOS = ["Enviada", "Revisión", "Tus datos", "Ticket TICS", "Cerrada"] as const;

/** Paso en curso (índice de PASOS); null en estados sin progreso. */
export function pasoActual(estado: EstadoSolicitudTecnica): number | null {
  switch (estado) {
    case "PENDIENTE":
      return 1;
    case "APROBADA":
      return 2;
    case "FORMULARIO_ENVIADO":
    case "ESPERA_TICKET":
    case "TICKET_CREADO":
      return 3;
    case "RESUELTO":
    case "CERRADA":
      return PASOS.length;
    default:
      return null;
  }
}

/** Estados en los que el solicitante todavía puede cancelar. */
export const ESTADOS_CANCELABLES: readonly EstadoSolicitudTecnica[] = ["PENDIENTE", "APROBADA", "FORMULARIO_ENVIADO"];

/** Estados en los que el solicitante puede llenar o corregir sus datos. */
export const ESTADOS_CON_FORMULARIO: readonly EstadoSolicitudTecnica[] = ["APROBADA", "FORMULARIO_ENVIADO"];

/** Estados que cuentan para el límite de 3 solicitudes activas. */
export const ESTADOS_ACTIVOS: readonly EstadoSolicitudTecnica[] = [
  "PENDIENTE",
  "APROBADA",
  "FORMULARIO_ENVIADO",
  "ESPERA_TICKET",
  "TICKET_CREADO",
];

export const MAX_SOLICITUDES_ACTIVAS = 3;

/** Texto legible de un tipo: "REINICIO_PASSWORD" -> "Reinicio de contraseña". */
export function nombreTipo(tipo: TipoSolicitud["nombre"]): string {
  switch (tipo) {
    case "REINICIO_PASSWORD":
      return "Reinicio de contraseña";
    case "REINICIO_AUTHENTICATOR":
      return "Reinicio de autenticador";
    case "OTRO":
      return "Otro problema";
    default:
      return tipo.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
  }
}
