import type { IsoDateTime } from "./common";

/**
 * Contratos del módulo `seguridad` (AuthController `/api/auth`,
 * PerfilController `/api/usuarios/me` y UsuarioController `/api/usuarios`).
 */

/**
 * Nombres de rol tal como los guarda la tabla `roles`.
 * Los ids siguen el orden de inserción del DataSeeder (1 a 4).
 */
export type NombreRol = "Admin" | "Operador-tics" | "Profesor" | "Estudiante";

/** UsuarioResponseDTO: usuario en sesión, listados y altas. */
export interface Usuario {
  idUsuario: number;
  nombre: string;
  apellidos: string | null;
  correo: string;
  idRol: number;
  nombreRol: NombreRol;
  activo: boolean;
  correoVerificado: boolean;
  ultimoAcceso: IsoDateTime | null;
  fechaCreacion: IsoDateTime | null;
}

/** Rol del catálogo `GET /api/usuarios/roles`. */
/** PUT /api/usuarios/me */
export interface PerfilUpdateRequest {
  nombre: string;
  apellidos: string | null;
}

/** PUT /api/usuarios/me/password */
export interface CambiarPasswordRequest {
  passwordActual: string;
  passwordNueva: string;
}

/**
 * GET /api/usuarios/me/eliminacion: qué se cancela al eliminar la cuenta.
 * Solo Profesor y Estudiante pueden eliminarla (`puedeEliminar`).
 */
export interface ResumenEliminacion {
  puedeEliminar: boolean;
  motivoNoPermitido: string | null;
  reservasFuturas: number;
  solicitudesReservaPendientes: number;
  /** Solicitudes de la mesa de ayuda sin ticket: se cancelan. */
  solicitudesTecnicasActivas: number;
  /** Solicitudes con ticket en la DTIC: se conservan. */
  ticketsEnPlataforma: number;
}

export interface Rol {
  idRol: number;
  nombreRol: NombreRol;
}

/** LoginRequest. El backend acepta `email` o `correo`. */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * SesionResponse de login, refresh y `GET /auth/me`. El token viaja en
 * cookies httpOnly (`tic_access`, `tic_refresh`); el frontend nunca lo ve.
 */
export interface SesionResponse {
  usuario: Usuario;
  accesoExpiraEnSegundos: number;
}

/**
 * POST /api/auth/verificar-correo: el token del enlace del correo, o el correo
 * y el código de 6 dígitos que viene en el mismo correo.
 */
export type VerificarCorreoRequest = { token: string } | { correo: string; codigo: string };

/** POST /api/auth/restablecer-password: igual que la verificación, más la contraseña nueva. */
export type RestablecerPasswordRequest = ({ token: string } | { correo: string; codigo: string }) & {
  nuevaPassword: string;
};

/** MensajeResponse: respuestas con solo un texto para el usuario. */
export interface MensajeResponse {
  message: string;
}

/**
 * UsuarioRegistroRequest: registro público. El rol lo decide el dominio del
 * correo (`alumno.uaemex.mx` -> Estudiante, resto -> Profesor) y la cuenta
 * queda pendiente de verificar el correo.
 */
export interface UsuarioRegistroRequest {
  nombre: string;
  apellidos: string;
  correo: string;
  password: string;
}

/** UsuarioAdminCreateRequest: alta desde el panel de administración. */
export interface UsuarioAdminCreateRequest {
  nombre: string;
  apellidos: string;
  correo: string;
  password: string;
  idRol: number;
  activo: boolean;
}

/**
 * UsuarioUpdateRequest. Todos los campos son opcionales; si `password` llega
 * vacío o nulo, el backend conserva la contraseña actual. Cambiar contraseña,
 * rol o estado cierra las sesiones de ese usuario.
 */
export interface UsuarioUpdateRequest {
  nombre?: string;
  apellidos?: string;
  correo?: string;
  password?: string | null;
  idRol?: number;
  activo?: boolean;
}
