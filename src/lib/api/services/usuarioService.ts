import { apiClient } from "../client";
import { request } from "../errors";
import type { Rol, Usuario, UsuarioAdminCreateRequest, UsuarioUpdateRequest } from "@/types/api";

/**
 * Endpoints de `/api/usuarios` (solo Admin). El login y el registro están en
 * authService.
 */
export const usuarioService = {
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

  /** GET /usuarios/roles: catálogo de roles con su id. */
  listarRoles: () =>
    request(async () => (await apiClient.get<Rol[]>("/usuarios/roles")).data, "Error al obtener los roles"),

  /** POST /usuarios/{id}/desbloquear: quita el bloqueo por intentos fallidos de login. */
  desbloquear: (id: number) =>
    request(async () => {
      await apiClient.post(`/usuarios/${id}/desbloquear`);
    }, "Error al desbloquear la cuenta"),
};
