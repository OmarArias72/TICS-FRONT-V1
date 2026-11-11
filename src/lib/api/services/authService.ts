import { apiClient } from "../client";
import { request } from "../errors";
import type {
  LoginRequest,
  MensajeResponse,
  RestablecerPasswordRequest,
  SesionResponse,
  UsuarioRegistroRequest,
  VerificarCorreoRequest,
} from "@/types/api";

/** Cabecera de reCAPTCHA v3, solo si hay token (el backend la ignora si está deshabilitado). */
const conRecaptcha = (recaptcha?: string | null) =>
  recaptcha ? { headers: { "X-Recaptcha-Token": recaptcha } } : undefined;

/** Endpoints de `/api/auth` (sesión por cookies httpOnly). */
export const authService = {
  /**
   * POST /auth/login. Responde la sesión y deja las cookies. Errores con
   * `codigo`: CREDENCIALES_INVALIDAS, CORREO_NO_VERIFICADO, CUENTA_INACTIVA,
   * CUENTA_BLOQUEADA (429 tras 5 intentos).
   */
  login: (credenciales: LoginRequest) =>
    request(
      async () => (await apiClient.post<SesionResponse>("/auth/login", credenciales)).data,
      "Error al iniciar sesión",
    ),

  /** GET /auth/me: 200 si la sesión de las cookies es válida. */
  sesionActual: () =>
    request(async () => (await apiClient.get<SesionResponse>("/auth/me")).data, "No hay sesión activa"),

  /** POST /auth/logout: borra las cookies y revoca el refresh token. */
  logout: () =>
    request(async () => {
      await apiClient.post("/auth/logout");
    }, "Error al cerrar sesión"),

  /**
   * POST /auth/registro: crea la cuenta pendiente de verificar y envía un correo
   * con un código de 6 dígitos y un enlace. Errores: CORREO_REGISTRADO,
   * CORREO_NO_INSTITUCIONAL, PASSWORD_INVALIDA.
   */
  registrar: (payload: UsuarioRegistroRequest, recaptcha?: string | null) =>
    request(
      async () => (await apiClient.post<MensajeResponse>("/auth/registro", payload, conRecaptcha(recaptcha))).data,
      "Error al registrar la cuenta",
    ),

  /**
   * POST /auth/verificar-correo con el token del enlace o con correo + código.
   * Errores: CODIGO_INVALIDO (trae los intentos restantes), CODIGO_EXPIRADO,
   * CODIGO_BLOQUEADO (5 intentos), TOKEN_INVALIDO, TOKEN_USADO, TOKEN_EXPIRADO.
   */
  verificarCorreo: (payload: VerificarCorreoRequest) =>
    request(
      async () => (await apiClient.post<MensajeResponse>("/auth/verificar-correo", payload)).data,
      "No se pudo verificar el correo",
    ),

  /**
   * POST /auth/reenviar-verificacion. Siempre responde lo mismo (no revela si el
   * correo existe). El backend no reenvía si pasaron menos de 60 s o van 5 en una hora.
   */
  reenviarVerificacion: (correo: string, recaptcha?: string | null) =>
    request(
      async () =>
        (await apiClient.post<MensajeResponse>("/auth/reenviar-verificacion", { correo }, conRecaptcha(recaptcha))).data,
      "No se pudo reenviar el código",
    ),

  /** POST /auth/olvide-password: envía código y enlace (1 h). Respuesta genérica. */
  olvidePassword: (correo: string, recaptcha?: string | null) =>
    request(
      async () => (await apiClient.post<MensajeResponse>("/auth/olvide-password", { correo }, conRecaptcha(recaptcha))).data,
      "No se pudo enviar el código",
    ),

  /**
   * POST /auth/restablecer-password con token o correo + código. Cierra todas las
   * sesiones del usuario. Errores: los de verificarCorreo y PASSWORD_INVALIDA.
   */
  restablecerPassword: (payload: RestablecerPasswordRequest) =>
    request(
      async () => (await apiClient.post<MensajeResponse>("/auth/restablecer-password", payload)).data,
      "No se pudo cambiar la contraseña",
    ),
};
