import type { IsoDateTime } from "./common";

/**
 * Contratos del módulo `seguridad` (UsuarioController, `/api/usuarios`).
 */

/**
 * Nombres de rol tal como los guarda la tabla `roles`.
 * Los ids siguen el orden de inserción del DataSeeder (1 a 4).
 */
export type NombreRol = "Admin" | "Operador-tics" | "Profesor" | "Estudiante";

/** UsuarioResponseDTO: respuesta de login, listados y altas. */
export interface Usuario {
  idUsuario: number;
  nombre: string;
  apellidos: string | null;
  correo: string;
  nombreRol: NombreRol;
  activo: boolean;
  fechaCreacion: IsoDateTime | null;
}

/** LoginRequest. El backend espera `email`, aunque el resto de DTO usa `correo`. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** UsuarioRegistroRequest: registro público desde el sitio web. */
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
 * UsuarioUpdateRequest. Si `password` llega vacío o nulo, el backend
 * conserva la contraseña actual.
 */
export interface UsuarioUpdateRequest {
  nombre: string;
  apellidos: string;
  correo: string;
  password?: string | null;
  idRol: number;
  activo: boolean;
}
