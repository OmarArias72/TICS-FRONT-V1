"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Mail, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

import { Alert, Button, FormField, Input } from "@/components/ui";
import { cardClass } from "@/components/ui/styles";
import { esCodigo } from "@/lib/api/errors";
import { authService } from "@/lib/api/services";

import { CodigoInput, normalizarCorreo } from "./CodigoInput";
import { NuevaPasswordCampos, passwordLista } from "./NuevaPasswordCampos";
import { useCuentaRegresiva } from "../hooks/useCuentaRegresiva";

/**
 * "Olvidé mi contraseña" (`/olvide-password`). No pide la contraseña actual:
 * la cuenta se identifica solo por su correo.
 *
 * 1. El usuario escribe el **correo de la cuenta** que quiere recuperar y se le
 *    envía un código de 6 dígitos (y un enlace) válido 1 hora.
 * 2. Con el correo (visible y editable), el código y la **nueva** contraseña,
 *    la cambia. Se cierran todas sus sesiones.
 *
 * "Ya tengo un código" salta al paso 2 si el correo llegó antes. La respuesta
 * del paso 1 es la misma exista o no la cuenta (no revela qué correos existen).
 */
export function OlvidePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paso, setPaso] = useState<1 | 2>(1);
  const [correo, setCorreo] = useState(searchParams.get("correo") ?? "");
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const { restante, iniciar } = useCuentaRegresiva();

  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());

  const solicitar = useMutation({
    mutationFn: () => authService.olvidePassword(normalizarCorreo(correo)),
    onSuccess: () => {
      setPaso(2);
      setCodigo("");
      setErrorCodigo(null);
      iniciar();
      toast.success("Si el correo tiene una cuenta, te enviamos un código.", { duration: 5000 });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cambiar = useMutation({
    mutationFn: () =>
      authService.restablecerPassword({ correo: normalizarCorreo(correo), codigo, nuevaPassword: password }),
    onSuccess: (r) => {
      toast.success(r.message || "Contraseña actualizada", { duration: 6000 });
      router.push(`/login?correo=${encodeURIComponent(normalizarCorreo(correo))}`);
    },
    onError: (err: Error) => {
      if (esCodigo(err, "PASSWORD_INVALIDA", "VALIDACION")) {
        setErrorPassword(err.message);
      } else {
        setErrorCodigo(err.message);
        if (esCodigo(err, "CODIGO_BLOQUEADO", "CODIGO_EXPIRADO")) setCodigo("");
      }
    },
  });

  const pedirCodigo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (correoValido) solicitar.mutate();
  };

  const confirmarCambio = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorCodigo(null);
    setErrorPassword(null);
    cambiar.mutate();
  };

  const campoCorreo = (
    <FormField
      label="Correo de la cuenta a recuperar"
      required
      hint={paso === 1 ? "Tu correo institucional (@uaemex.mx o @alumno.uaemex.mx)." : undefined}
    >
      {(a11y) => (
        <Input
          {...a11y}
          type="email"
          autoComplete="email"
          autoFocus={paso === 1}
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="tucorreo@alumno.uaemex.mx"
        />
      )}
    </FormField>
  );

  return (
    <div className={`${cardClass} max-w-md`}>
      <div className="mb-6 text-center">
        <KeyRound className="mx-auto h-10 w-10 text-verde" aria-hidden="true" />
        <h1 className="mt-2 text-2xl font-extrabold">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-sobre-variante">
          {paso === 1
            ? "No necesitas tu contraseña. Escribe el correo de tu cuenta y te enviaremos un código para crear una nueva."
            : "Escribe el código que te enviamos (vence en 1 hora) y elige tu nueva contraseña. Revisa también el correo no deseado."}
        </p>
      </div>

      {paso === 1 ? (
        <form noValidate onSubmit={pedirCodigo} className="flex flex-col gap-4">
          {campoCorreo}
          <Button
            type="submit"
            loading={solicitar.isPending}
            disabled={!correoValido}
            icon={<Mail className="h-4 w-4" aria-hidden="true" />}
          >
            Enviar código
          </Button>
          <button
            type="button"
            onClick={() => setPaso(2)}
            className="text-sm font-semibold text-verde hover:text-dorado-texto"
          >
            Ya tengo un código
          </button>
        </form>
      ) : (
        <form noValidate onSubmit={confirmarCambio} className="flex flex-col gap-4">
          {campoCorreo}
          <FormField label="Código de 6 dígitos" required error={errorCodigo ?? undefined}>
            {(a11y) => <CodigoInput {...a11y} value={codigo} onCambio={setCodigo} />}
          </FormField>
          <NuevaPasswordCampos
            password={password}
            confirmar={confirmar}
            onPassword={(v) => {
              setPassword(v);
              setErrorPassword(null);
            }}
            onConfirmar={setConfirmar}
            error={errorPassword}
          />
          <Alert tone="info">Al cambiarla se cerrará tu sesión en todos tus dispositivos.</Alert>
          <Button
            type="submit"
            loading={cambiar.isPending}
            disabled={!correoValido || codigo.length !== 6 || !passwordLista(password, confirmar)}
          >
            Cambiar contraseña
          </Button>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={!correoValido || restante > 0 || solicitar.isPending}
              icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
              onClick={() => solicitar.mutate()}
            >
              {restante > 0 ? `Reenviar código en ${restante} s` : "Enviar código otra vez"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-5 border-t border-variante pt-4 text-center text-sm">
        <Link href="/login" className="font-semibold text-verde hover:text-dorado-texto">
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
