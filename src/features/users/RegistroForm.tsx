"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircle, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";

import { PasswordChecklist } from "@/components/ui/PasswordChecklist";
import { cardClass, inputClass, labelClass, primaryButtonClass } from "@/components/ui/styles";
import { authService } from "@/lib/api/services";
import { validarPassword } from "@/lib/validation/password";
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
 * - Llama a POST /auth/registro; antes solo hacía console.log.
 * - Sin selector de rol: el backend lo decide por el dominio del correo
 *   (`@alumno.uaemex.mx` -> Estudiante, `@uaemex.mx` -> Profesor).
 * - La cuenta queda pendiente hasta verificar el correo: llega un código de 6
 *   dígitos y un enlace; después del registro se abre /verificar-correo.
 * - La contraseña debe cumplir las mismas reglas que en Gestión de Usuarios.
 */
export function RegistroForm() {
  const [formData, setFormData] = useState<UsuarioRegistroRequest>(FORMULARIO_VACIO);
  const router = useRouter();

  const registro = useMutation({
    mutationFn: (payload: UsuarioRegistroRequest) => authService.registrar(payload),
    onSuccess: (respuesta, enviado) => {
      toast.success(respuesta.message || "Cuenta creada. Revisa tu correo para verificarla.", { duration: 6000 });
      setFormData(FORMULARIO_VACIO);
      // Siguiente paso: escribir el código que llegó al correo
      router.push(`/verificar-correo?nuevo=1&correo=${encodeURIComponent(enviado.correo.toLowerCase())}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const errorPassword = validarPassword(formData.password);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (errorPassword) {
      toast.error(errorPassword);
      return;
    }
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
            aria-describedby="registro-correo-ayuda"
            placeholder="tucorreo@alumno.uaemex.mx"
          />
          <p id="registro-correo-ayuda" className="mt-1 text-xs text-sobre-variante">
            Usa tu correo institucional (@alumno.uaemex.mx o @uaemex.mx). Te enviaremos un código para verificarlo.
          </p>
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
            aria-describedby="registro-password-reglas"
            aria-invalid={formData.password !== "" && errorPassword !== null}
            className={inputClass}
          />
          <div className="mt-2">
            <PasswordChecklist id="registro-password-reglas" value={formData.password} />
          </div>
        </div>

        <p className="rounded-xl bg-variante/60 px-3 py-2 text-xs text-sobre-variante">
          Usa tu correo institucional: con <strong>@alumno.uaemex.mx</strong> la cuenta será de
          Estudiante y con <strong>@uaemex.mx</strong>, de Profesor. Te enviaremos un enlace para
          verificarlo antes de iniciar sesión.
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
