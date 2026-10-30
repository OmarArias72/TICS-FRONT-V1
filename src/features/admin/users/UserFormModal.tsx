"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";

import { Alert, Button, FormField, Input, Modal, Select } from "@/components/ui";
import { PasswordChecklist } from "@/components/ui/PasswordChecklist";
import { ID_ROL } from "@/lib/auth/roles";
import type { NombreRol, Usuario } from "@/types/api";

import { crearEsquemaUsuario, type UsuarioFormValues } from "./schemas";

const OPCIONES_ROL = Object.entries(ID_ROL) as Array<[NombreRol, number]>;
const ID_FORMULARIO = "form-usuario";

function valoresIniciales(usuario: Usuario | null): UsuarioFormValues {
  return {
    nombre: usuario?.nombre ?? "",
    apellidos: usuario?.apellidos ?? "",
    correo: usuario?.correo ?? "",
    // Corrección respecto al original: el backend envía `nombreRol`, no `idRol`,
    // y el formulario siempre arrancaba en Profesor (id 3) al editar.
    idRol: usuario ? ID_ROL[usuario.nombreRol] : ID_ROL.Profesor,
    activo: usuario?.activo ?? true,
    password: "",
    confirmarPassword: "",
  };
}

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Usuario a editar; `null` para crear uno nuevo. */
  usuario: Usuario | null;
  /** `true` si el Admin está editando su propia cuenta. */
  esPropio: boolean;
  saving: boolean;
  onSubmit: (values: UsuarioFormValues) => void;
}

/** Alta y edición de usuarios desde Gestión de Usuarios. */
export function UserFormModal({
  open,
  onClose,
  usuario,
  esPropio,
  saving,
  onSubmit,
}: UserFormModalProps) {
  const editando = usuario !== null;

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      size="md"
      title={editando ? "Editar usuario" : "Registrar nuevo usuario"}
      description={editando ? usuario.correo : "La cuenta quedará lista para iniciar sesión."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={ID_FORMULARIO} loading={saving}>
            {editando ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </>
      }
    >
      {/*
        El formulario solo existe mientras el modal está abierto y su `key`
        cambia con el usuario: cada apertura crea un formulario nuevo con los
        valores correctos, sin sincronizar estado en efectos.
      */}
      {open && (
        <UserForm
          key={usuario?.idUsuario ?? "nuevo"}
          usuario={usuario}
          esPropio={esPropio}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function UserForm({
  usuario,
  esPropio,
  onSubmit,
}: Pick<UserFormModalProps, "usuario" | "esPropio" | "onSubmit">) {
  const editando = usuario !== null;
  const [verPassword, setVerPassword] = useState(false);
  // useState con inicializador: el esquema se crea una sola vez por formulario.
  const [esquema] = useState(() => crearEsquemaUsuario(editando ? "editar" : "crear"));
  const [iniciales] = useState(() => valoresIniciales(usuario));

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(esquema),
    defaultValues: iniciales,
  });

  // useWatch (en lugar de watch) es compatible con el React Compiler.
  const password = useWatch({ control, name: "password" });
  const tipoPassword = verPassword ? "text" : "password";

  const opcionesRol = OPCIONES_ROL.map(([nombre, id]) => (
    <option key={id} value={id}>
      {nombre}
    </option>
  ));

  return (
    <form
      id={ID_FORMULARIO}
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <FormField label="Nombre(s)" required error={errors.nombre?.message}>
        {(a11y) => <Input {...a11y} autoComplete="off" {...register("nombre")} />}
      </FormField>
      <FormField label="Apellidos" required error={errors.apellidos?.message}>
        {(a11y) => <Input {...a11y} autoComplete="off" {...register("apellidos")} />}
      </FormField>
      <FormField
        label="Correo electrónico"
        required
        error={errors.correo?.message}
        className="sm:col-span-2"
      >
        {(a11y) => <Input {...a11y} type="email" autoComplete="off" {...register("correo")} />}
      </FormField>

      {esPropio && (
        <Alert tone="neutro" className="sm:col-span-2">
          No puedes cambiar tu propio rol ni desactivar tu cuenta. Pídeselo a otro administrador.
        </Alert>
      )}

      <FormField label="Rol" required error={errors.idRol?.message}>
        {(a11y) =>
          esPropio ? (
            // Sin `register`: el valor se conserva desde defaultValues y no se puede cambiar.
            <Select {...a11y} value={iniciales.idRol} disabled onChange={() => {}}>
              {opcionesRol}
            </Select>
          ) : (
            <Select {...a11y} {...register("idRol", { valueAsNumber: true })}>
              {opcionesRol}
            </Select>
          )
        }
      </FormField>

      <div className="flex items-end">
        <label className="flex h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold text-sobre-superficie has-disabled:cursor-not-allowed has-disabled:opacity-60">
          {esPropio ? (
            <input type="checkbox" checked disabled readOnly className="h-5 w-5 accent-verde" />
          ) : (
            <input type="checkbox" className="h-5 w-5 accent-verde" {...register("activo")} />
          )}
          Cuenta activa
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-variante pt-4 sm:col-span-2">
        <p className="text-sm font-bold text-sobre-superficie">
          {editando ? "Cambiar contraseña" : "Contraseña"}
          {editando && (
            <span className="ml-1 font-normal text-sobre-variante">
              (déjala vacía para conservar la actual)
            </span>
          )}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label={editando ? "Nueva contraseña" : "Contraseña"}
            required={!editando}
            error={errors.password?.message}
          >
            {(a11y) => (
              <div className="relative">
                <Input
                  {...a11y}
                  type={tipoPassword}
                  autoComplete="new-password"
                  className="pr-11"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={verPassword}
                  className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-sobre-variante hover:bg-variante focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado"
                >
                  {verPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
          </FormField>
          <FormField
            label="Confirmar contraseña"
            required={!editando}
            error={errors.confirmarPassword?.message}
          >
            {(a11y) => (
              <Input
                {...a11y}
                type={tipoPassword}
                autoComplete="new-password"
                {...register("confirmarPassword")}
              />
            )}
          </FormField>
        </div>
        {(!editando || password) && <PasswordChecklist value={password ?? ""} />}
      </div>
    </form>
  );
}
