"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, X } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  Button,
  Card,
  ConfirmDialog,
  Input,
  Label,
  PageContainer,
  PageHeader,
  Select,
} from "@/components/ui";
import { ID_ROL } from "@/lib/auth/roles";
import { usuarioService } from "@/lib/api/services";
import { useAuthStore } from "@/store/authStore";
import type { NombreRol, Usuario, UsuarioAdminCreateRequest, UsuarioUpdateRequest } from "@/types/api";

import type { UsuarioFormValues } from "./schemas";
import { UserFormModal } from "./UserFormModal";
import { UsersTable } from "./UsersTable";

const CLAVE_USUARIOS = ["usuarios"] as const;
const ROLES = Object.keys(ID_ROL) as NombreRol[];

type FiltroEstado = "" | "activo" | "inactivo";

/**
 * Gestión de Usuarios (antes AdminUsersPage.jsx). Solo Admin, según
 * lib/auth/permisos.ts ("usuarios.gestionar"); el guard de rutas ya lo impide
 * para otros roles, por eso aquí no se repite la comprobación.
 *
 * Reglas añadidas (decisión 2026-10-30):
 * - El Admin no puede eliminarse ni desactivarse a sí mismo, ni cambiar su rol.
 * - Las contraseñas nuevas deben cumplir lib/validation/password.ts.
 */
export function UsersAdminPage() {
  const queryClient = useQueryClient();
  const usuarioActual = useAuthStore((s) => s.user);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<"" | NombreRol>("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("");

  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [porEliminar, setPorEliminar] = useState<Usuario | null>(null);

  const usuariosQuery = useQuery({
    queryKey: CLAVE_USUARIOS,
    queryFn: usuarioService.listarUsuarios,
  });

  const esPropio = (u: Usuario | null) => u !== null && u.idUsuario === usuarioActual?.idUsuario;

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return (usuariosQuery.data ?? []).filter((u) => {
      if (filtroRol && u.nombreRol !== filtroRol) return false;
      if (filtroEstado === "activo" && !u.activo) return false;
      if (filtroEstado === "inactivo" && u.activo) return false;
      if (termino) {
        const nombre = `${u.nombre} ${u.apellidos ?? ""}`.toLowerCase();
        if (!nombre.includes(termino) && !u.correo.toLowerCase().includes(termino)) return false;
      }
      return true;
    });
  }, [usuariosQuery.data, busqueda, filtroRol, filtroEstado]);

  const hayFiltros = busqueda.trim() !== "" || filtroRol !== "" || filtroEstado !== "";

  const cerrarFormulario = () => {
    setFormAbierto(false);
    setEditando(null);
  };

  const guardar = useMutation({
    mutationFn: async (values: UsuarioFormValues) => {
      const base = {
        nombre: values.nombre.trim(),
        apellidos: values.apellidos.trim(),
        correo: values.correo.trim(),
        idRol: values.idRol,
        activo: values.activo,
      };

      if (editando) {
        // Refuerzo de la regla: tu propia cuenta conserva su rol y queda activa,
        // aunque el formulario se haya manipulado.
        const propio = esPropio(editando);
        const payload: UsuarioUpdateRequest = {
          ...base,
          idRol: propio ? ID_ROL[editando.nombreRol] : base.idRol,
          activo: propio ? true : base.activo,
          // Vacía: el backend conserva la contraseña actual.
          password: values.password ? values.password : null,
        };
        return usuarioService.actualizarUsuario(editando.idUsuario, payload);
      }

      const payload: UsuarioAdminCreateRequest = { ...base, password: values.password };
      return usuarioService.crearDesdeAdmin(payload);
    },
    onSuccess: (usuario) => {
      void queryClient.invalidateQueries({ queryKey: CLAVE_USUARIOS });
      // Si editaste tu propia cuenta, se actualiza el nombre en la barra superior.
      if (usuario.idUsuario === usuarioActual?.idUsuario) {
        useAuthStore.setState({ user: usuario });
      }
      toast.success(editando ? "Usuario actualizado" : "Usuario creado");
      cerrarFormulario();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cambiarEstado = useMutation({
    mutationFn: (u: Usuario) => usuarioService.cambiarEstado(u.idUsuario, !u.activo),
    onSuccess: (u) => {
      void queryClient.invalidateQueries({ queryKey: CLAVE_USUARIOS });
      toast.success(u.activo ? "Cuenta activada" : "Cuenta desactivada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const eliminar = useMutation({
    mutationFn: (u: Usuario) => usuarioService.eliminarUsuario(u.idUsuario),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLAVE_USUARIOS });
      toast.success("Usuario eliminado");
      setPorEliminar(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const total = usuariosQuery.data?.length ?? 0;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Administración TIC"
        title="Gestión de Usuarios"
        description={
          usuariosQuery.isSuccess
            ? `${total} ${total === 1 ? "usuario registrado" : "usuarios registrados"}`
            : "Altas, roles y acceso de las cuentas del sistema."
        }
        actions={
          <Button
            icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setEditando(null);
              setFormAbierto(true);
            }}
          >
            Nuevo usuario
          </Button>
        }
      />

      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div className="flex min-w-60 flex-1 flex-col gap-1.5">
          <Label htmlFor="buscar-usuario">Buscar</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-sobre-variante"
              aria-hidden="true"
            />
            <Input
              id="buscar-usuario"
              type="search"
              placeholder="Nombre o correo"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filtro-rol">Rol</Label>
          <Select
            id="filtro-rol"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value as "" | NombreRol)}
            className="w-48"
          >
            <option value="">Todos los roles</option>
            {ROLES.map((rol) => (
              <option key={rol} value={rol}>
                {rol}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filtro-estado">Estado</Label>
          <Select
            id="filtro-estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
            className="w-40"
          >
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </Select>
        </div>
        {hayFiltros && (
          <Button
            variant="ghost"
            icon={<X className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setBusqueda("");
              setFiltroRol("");
              setFiltroEstado("");
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </Card>

      <Card className="overflow-hidden">
        <UsersTable
          usuarios={usuariosFiltrados}
          cargando={usuariosQuery.isPending}
          error={usuariosQuery.isError ? usuariosQuery.error.message : null}
          idUsuarioActual={usuarioActual?.idUsuario}
          idCambiandoEstado={cambiarEstado.isPending ? (cambiarEstado.variables?.idUsuario ?? null) : null}
          onEditar={(u) => {
            setEditando(u);
            setFormAbierto(true);
          }}
          onEliminar={(u) => {
            if (!esPropio(u)) setPorEliminar(u);
          }}
          onCambiarEstado={(u) => {
            if (!esPropio(u)) cambiarEstado.mutate(u);
          }}
        />
      </Card>

      <UserFormModal
        open={formAbierto}
        onClose={cerrarFormulario}
        usuario={editando}
        esPropio={esPropio(editando)}
        saving={guardar.isPending}
        onSubmit={(values) => guardar.mutate(values)}
      />

      <ConfirmDialog
        open={porEliminar !== null}
        onClose={() => setPorEliminar(null)}
        onConfirm={() => porEliminar && eliminar.mutate(porEliminar)}
        loading={eliminar.isPending}
        title={`¿Eliminar a ${porEliminar?.nombre ?? ""}?`}
        description={
          <>
            Se eliminará la cuenta <strong>{porEliminar?.correo}</strong>. Esta acción no se puede
            deshacer. Si solo quieres impedir el acceso, desactiva la cuenta.
          </>
        }
        confirmLabel="Eliminar usuario"
      />
    </PageContainer>
  );
}
