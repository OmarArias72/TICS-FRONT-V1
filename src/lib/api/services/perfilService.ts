import { apiClient } from "../client";
import { request } from "../errors";
import type {
  CambiarPasswordRequest,
  MensajeResponse,
  PerfilUpdateRequest,
  ResumenEliminacion,
  Usuario,
} from "@/types/api";

const BASE = "/usuarios/me";

/**
 * Perfil del usuario en sesión (`/api/usuarios/me`). Cualquier rol puede ver y
 * editar su nombre y cambiar su contraseña; solo Profesor y Estudiante pueden
 * eliminar su cuenta (ELIMINACION_NO_PERMITIDA para Admin y Operador).
 */
export const perfilService = {
  obtener: () => request(async () => (await apiClient.get<Usuario>(BASE)).data, "Error al obtener tu perfil"),

  /** Nombre y apellidos. El correo tiene su propio endpoint; el rol solo lo cambia el Admin. */
  actualizar: (payload: PerfilUpdateRequest) =>
    request(async () => (await apiClient.put<Usuario>(BASE, payload)).data, "Error al guardar tu perfil"),

  /**
   * PUT /usuarios/me/correo (cualquier rol): cambio directo confirmando la contraseña.
   * El correo debe ser institucional y no estar en uso; el rol no cambia y la sesión
   * sigue válida. Errores: PASSWORD_ACTUAL_INCORRECTA (400), CORREO_NO_INSTITUCIONAL,
   * CORREO_REGISTRADO, CORREO_SIN_CAMBIO.
   */
  cambiarCorreo: (correoNuevo: string, password: string) =>
    request(
      async () => (await apiClient.put<Usuario>(`${BASE}/correo`, { correoNuevo, password })).data,
      "Error al cambiar el correo",
    ),

  /**
   * Cierra las sesiones en otros dispositivos y renueva la actual (cookies nuevas).
   * Errores: PASSWORD_ACTUAL_INCORRECTA, PASSWORD_INVALIDA.
   */
  cambiarPassword: (payload: CambiarPasswordRequest) =>
    request(
      async () => (await apiClient.put<MensajeResponse>(`${BASE}/password`, payload)).data,
      "Error al cambiar la contraseña",
    ),

  /** Qué se cancelará al eliminar la cuenta y si el rol puede hacerlo. */
  resumenEliminacion: () =>
    request(
      async () => (await apiClient.get<ResumenEliminacion>(`${BASE}/eliminacion`)).data,
      "Error al consultar tu cuenta",
    ),

  /**
   * Elimina (anonimiza) la cuenta y borra las cookies. Cancela reservas futuras,
   * solicitudes de reserva pendientes y solicitudes de la mesa de ayuda sin ticket.
   * Errores: PASSWORD_ACTUAL_INCORRECTA (400), ELIMINACION_NO_PERMITIDA (403).
   */
  eliminarCuenta: (password: string) =>
    request(async () => {
      await apiClient.delete(BASE, { data: { password } });
    }, "Error al eliminar la cuenta"),
};
