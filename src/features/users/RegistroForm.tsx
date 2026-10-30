"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircle, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";

import { cardClass, inputClass, labelClass, primaryButtonClass } from "@/components/ui/styles";
import { usuarioService } from "@/lib/api/services";
import type { UsuarioRegistroRequest } from "@/types/api";

const FORMULARIO_VACIO: UsuarioRegistroRequest = {
  nombre: "",
  apellidos: "",
  correo: "",
  password: "",
};

/**
 * Registro público (antes RegistroUsuarioPage.jsx).
 *
 * Cambios respecto al original:
 * - Ahora llama a POST /usuarios/registro; antes solo hacía console.log.
 * - Se quitó el selector de rol: el backend lo ignora y asigna siempre el rol
 *   "Profesor". Los demás roles se asignan desde Gestión de Usuarios.
 */
export function RegistroForm() {
  const [formData, setFormData] = useState<UsuarioRegistroRequest>(FORMULARIO_VACIO);
  const router = useRouter();

  const registro = useMutation({
    mutationFn: usuarioService.registrar,
    onSuccess: () => {
      toast.success("Cuenta creada. Ya puedes iniciar sesión.");
      setFormData(FORMULARIO_VACIO);
      router.push("/login");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    registro.mutate({
      ...formData,
      nombre: formData.nombre.trim(),
      apellidos: formData.apellidos.trim(),
      correo: formData.correo.trim(),
    });
  };

  return (
    <div className={`${cardClass} max-w-lg`}>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold text-sobre-superficie">Registro de Usuario</h1>
        <p className="mt-1 text-sm text-sobre-variante">
          Alta de nuevos accesos al sistema de infraestructura
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="registro-nombre" className={labelClass}>
              Nombre(s)
            </label>
            <input
              id="registro-nombre"
              name="nombre"
              type="text"
              autoComplete="given-name"
              required
              value={formData.nombre}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="registro-apellidos" className={labelClass}>
              Apellidos
            </label>
            <input
              id="registro-apellidos"
              name="apellidos"
              type="text"
              autoComplete="family-name"
              required
              value={formData.apellidos}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="registro-correo" className={labelClass}>
            Correo Electrónico
          </label>
          <input
            id="registro-correo"
            name="correo"
            type="email"
            autoComplete="email"
            required
            value={formData.correo}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="registro-password" className={labelClass}>
            Contraseña
          </label>
          <input
            id="registro-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <p className="rounded-xl bg-variante/60 px-3 py-2 text-xs text-sobre-variante">
          Las cuentas nuevas se crean con el rol de Profesor. Si necesitas otro rol, solicítalo al
          administrador.
        </p>

        <button
          type="submit"
          disabled={registro.isPending}
          className={`${primaryButtonClass} mt-2 w-full`}
        >
          {registro.isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          )}
          {registro.isPending ? "Registrando..." : "Registrar Usuario"}
        </button>
      </form>

      <p className="mt-6 border-t border-variante pt-5 text-center text-sm text-sobre-variante">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-verde hover:text-dorado-texto">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
