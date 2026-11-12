"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CircleCheck, LoaderCircle, MailCheck, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

import { Alert, Button, FormField, Input } from "@/components/ui";
import { cardClass } from "@/components/ui/styles";
import { esCodigo } from "@/lib/api/errors";
import { authService } from "@/lib/api/services";

import { CodigoInput, normalizarCorreo } from "./CodigoInput";
import { useCuentaRegresiva } from "../hooks/useCuentaRegresiva";

/**
 * Verificación del correo (`/verificar-correo`).
 *
 * - `?token=...` (enlace del correo): verifica sola al abrir la página.
 * - `?correo=...` (después del registro o desde el login): formulario para
 *   escribir el código de 6 dígitos, con "Reenviar código" cada 60 s.
 */
export function VerificarCorreoForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const recienRegistrado = searchParams.get("nuevo") === "1";
  const [correo, setCorreo] = useState(searchParams.get("correo") ?? "");
  const [codigo, setCodigo] = useState("");
  const [verificado, setVerificado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { restante, iniciar } = useCuentaRegresiva();

  const verificar = useMutation({
    mutationFn: authService.verificarCorreo,
    onSuccess: (r) => setVerificado(r.message),
    onError: (err: Error) => {
      setError(err.message);
      if (esCodigo(err, "CODIGO_BLOQUEADO", "CODIGO_EXPIRADO")) setCodigo("");
    },
  });

  const reenviar = useMutation({
    mutationFn: () => authService.reenviarVerificacion(normalizarCorreo(correo)),
    onSuccess: () => {
      iniciar();
      setError(null);
      setCodigo("");
      toast.success("Si tu cuenta está pendiente, te enviamos un código nuevo.", { duration: 6000 });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Recién registrado: el correo acaba de salir, así que "Reenviar" espera 60 s.
  useEffect(() => {
    if (recienRegistrado) iniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enlace del correo: se verifica una sola vez (en desarrollo React monta dos veces).
  const enviado = useRef(false);
  useEffect(() => {
    if (token && !enviado.current) {
      enviado.current = true;
      verificar.mutate({ token });
    }
  }, [token, verificar]);

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    verificar.mutate({ correo: normalizarCorreo(correo), codigo });
  };

  if (verificado) {
    return (
      <div className={`${cardClass} max-w-md text-center`}>
        <CircleCheck className="mx-auto h-12 w-12 text-verde" aria-hidden="true" />
        <h1 className="mt-3 text-2xl font-extrabold">Correo verificado</h1>
        <p className="mt-2 text-sm text-sobre-variante">{verificado}</p>
        <Link
          href={correo ? `/login?correo=${encodeURIComponent(normalizarCorreo(correo))}` : "/login"}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-verde px-6 text-sm font-bold text-white hover:bg-verde-oscuro"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (token) {
    return (
      <div className={`${cardClass} max-w-md text-center`}>
        {verificar.isPending || !error ? (
          <>
            <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-verde" aria-hidden="true" />
            <p className="mt-3 font-semibold">Verificando tu correo...</p>
          </>
        ) : (
          <>
            <Alert tone="error" title="No se pudo verificar con este enlace.">
              {error}
            </Alert>
            <p className="mt-4 text-sm text-sobre-variante">
              Si ya habías verificado tu cuenta, solo inicia sesión. Si el enlace venció, pide un código nuevo.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/login" className="inline-flex h-10 items-center rounded-xl border border-variante px-4 text-sm font-bold">
                Iniciar sesión
              </Link>
              <Link href="/verificar-correo" className="inline-flex h-10 items-center rounded-xl bg-verde px-4 text-sm font-bold text-white">
                Usar un código
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`${cardClass} max-w-md`}>
      <div className="mb-6 text-center">
        <MailCheck className="mx-auto h-10 w-10 text-verde" aria-hidden="true" />
        <h1 className="mt-2 text-2xl font-extrabold">Verifica tu correo</h1>
        <p className="mt-1 text-sm text-sobre-variante">
          {recienRegistrado ? "Tu cuenta se creó. " : ""}Te enviamos un código de 6 dígitos. Escríbelo aquí o abre el
          enlace del mismo correo. Revisa también la carpeta de correo no deseado.
        </p>
      </div>

      <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
        <FormField label="Correo institucional" required>
          {(a11y) => (
            <Input
              {...a11y}
              type="email"
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tucorreo@uaemex.mx"
            />
          )}
        </FormField>
        <FormField label="Código de verificación" required error={error ?? undefined}>
          {(a11y) => <CodigoInput {...a11y} value={codigo} onCambio={setCodigo} />}
        </FormField>
        <Button type="submit" loading={verificar.isPending} disabled={!correo.trim() || codigo.length !== 6}>
          Verificar
        </Button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-2 border-t border-variante pt-4 text-sm">
        <Button
          variant="ghost"
          size="sm"
          disabled={!correo.trim() || restante > 0 || reenviar.isPending}
          icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={() => reenviar.mutate()}
        >
          {restante > 0 ? `Reenviar código en ${restante} s` : "Reenviar código"}
        </Button>
        <Link href="/login" className="font-semibold text-verde hover:text-dorado-texto">
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
