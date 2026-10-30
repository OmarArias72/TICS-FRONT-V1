import { apiClient } from "../client";
import { request } from "../errors";
import type {
  LoginRequest,
  Usuario,
  UsuarioAdminCreateRequest,
  UsuarioRegistroRequest,
  UsuarioUpdateRequest,
} from "@/types/api";

/** Endpoints de `/api/usuarios`. */
export const usuarioService = {
  /** POST /usuarios/login. Responde 401 con el motivo en texto si falla. */
  login: (credenciales: LoginRequest) =>
    request(
      async () => (await apiClient.post<Usuario>("/usuarios/login", credenciales)).data,
      "Error al iniciar sesión",
    ),

  /**
   * POST /usuarios/registro. Registro público desde el sitio.
   * Nuevo respecto al original: la página de registro no llamaba al backend.
   */
  registrar: (payload: UsuarioRegistroRequest) =>
    request(
      async () => (await apiClient.post<Usuario>("/usuarios/registro", payload)).data,
      "Error al registrar el usuario",
    ),

  listarUsuarios: () =>
    request(
      async () => (await apiClient.get<Usuario[]>("/usuarios")).data,
      "Error al obtener los usuarios",
    ),

  obtenerPorId: (id: number) =>
    request(
      async () => (await apiClient.get<Usuario>(`/usuarios/${id}`)).data,
      "Error al obtener el usuario",
    ),

  crearDesdeAdmin: (payload: UsuarioAdminCreateRequest) =>
    request(
      async () => (await apiClient.post<Usuario>("/usuarios/admin/crear", payload)).data,
      "Error al crear usuario",
    ),

  actualizarUsuario: (id: number, payload: UsuarioUpdateRequest) =>
    request(
      async () => (await apiClient.put<Usuario>(`/usuarios/${id}`, payload)).data,
      "Error al actualizar usuario",
    ),

  /** DELETE /usuarios/{id}. Responde 204 sin cuerpo. */
  eliminarUsuario: (id: number) =>
    request(async () => {
      await apiClient.delete(`/usuarios/${id}`);
      return true as const;
    }, "Error al eliminar usuario"),

  cambiarEstado: (id: number, activo: boolean) =>
    request(
      async () =>
        (await apiClient.patch<Usuario>(`/usuarios/${id}/estado`, null, { params: { activo } }))
          .data,
      "Error al cambiar el estado del usuario",
    ),
};
