import { horaActual, hoyISO, sumarDias } from "@/lib/fechas";
import type { UsoSala } from "@/types/api";

/**
 * Reglas de reserva de salas (decisión 2026-10-30).
 *
 * - Horario y duración libres: solo se exige que el fin sea posterior al inicio.
 * - Anticipación: desde hoy hasta MAX_DIAS_ANTICIPACION días; nunca en el pasado.
 * - Reserva directa por defecto. Si el horario choca con otra reserva o supera
 *   la anticipación máxima, se ofrece una solicitud extraordinaria.
 *
 * El backend solo valida fin > inicio y el empalme de horarios; el resto se
 * aplica aquí.
 */
export const MAX_DIAS_ANTICIPACION = 30;

/** Estados de un uso de sala que ocupan el horario (igual que el backend). */
const ESTADOS_QUE_OCUPAN = new Set(["Confirmada", "Reservada"]);

export interface Horario {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

export type Evaluacion =
  /** Se puede reservar directamente. */
  | { tipo: "directa" }
  /** No se puede reservar directo, pero sí pedir una solicitud extraordinaria. */
  | { tipo: "solicitud"; motivo: string }
  /** Datos inválidos: no se puede reservar ni solicitar. */
  | { tipo: "invalido"; motivo: string };

/** Fecha máxima permitida para una reserva directa (YYYY-MM-DD). */
export function fechaMaxima(): string {
  return sumarDias(hoyISO(), MAX_DIAS_ANTICIPACION);
}

/**
 * Usos de la agenda que se empalman con el horario (comparando HH:mm).
 * `agenda` debe ser la agenda de la misma sala y fecha (así la entrega el
 * backend); el DTO no incluye la fecha de cada uso.
 */
export function empalmes(horario: Horario, agenda: UsoSala[]): UsoSala[] {
  return agenda.filter(
    (uso) =>
      ESTADOS_QUE_OCUPAN.has(uso.estado) &&
      horario.horaInicio < uso.horaFin &&
      horario.horaFin > uso.horaInicio,
  );
}

/** Decide si un horario admite reserva directa, solo solicitud o ninguna. */
export function evaluarHorario(horario: Horario, agenda: UsoSala[]): Evaluacion {
  const { fecha, horaInicio, horaFin } = horario;
  if (!fecha || !horaInicio || !horaFin) {
    return { tipo: "invalido", motivo: "Completa la fecha y el horario." };
  }
  if (horaFin <= horaInicio) {
    return { tipo: "invalido", motivo: "La hora de fin debe ser posterior a la hora de inicio." };
  }
  const hoy = hoyISO();
  if (fecha < hoy || (fecha === hoy && horaInicio <= horaActual())) {
    return { tipo: "invalido", motivo: "No se puede reservar en una fecha u hora que ya pasó." };
  }
  if (fecha > fechaMaxima()) {
    return {
      tipo: "solicitud",
      motivo: `Las reservas directas se permiten hasta ${MAX_DIAS_ANTICIPACION} días adelante.`,
    };
  }
  const choques = empalmes(horario, agenda);
  if (choques.length > 0) {
    const ocupado = choques.map((u) => `${u.horaInicio}–${u.horaFin}`).join(", ");
    return { tipo: "solicitud", motivo: `La sala ya está ocupada de ${ocupado}.` };
  }
  return { tipo: "directa" };
}

/**
 * Límite para que el profesor cancele o modifique su propia reserva
 * (decisión 2026-10-30): hasta el día anterior a la fecha de la reserva.
 * El mismo día solo la administración de TICS puede cambiarla.
 */
export function profesorPuedeCambiar(fechaReserva: string): boolean {
  return fechaReserva > hoyISO();
}

export const MENSAJE_LIMITE_PROFESOR =
  "Solo puedes cancelar o modificar tu reserva hasta el día anterior. El mismo día, cualquier cambio lo hace la administración de TICS.";
