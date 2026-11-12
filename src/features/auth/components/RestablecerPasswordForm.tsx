"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { toast } from "react-hot-toast";

import { Alert, Button } from "@/components/ui";
import { cardClass } from "@/components/ui/styles";
import { esCodigo } from "@/lib/api/errors";
import { authService } from "@/lib/api/services";

import { NuevaPasswordCampos, passwordLista } from "./NuevaPasswordCampos";

/**
 * Nueva contraseña desde el enlace del correo (`/restablecer-password?token=...`).
 * Si el enlace ya no sirve, ofrece pedir un código nuevo.
 */
export function RestablecerPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [errorEnlace, setErrorEnlace] = useState<string | null>(null);

  const cambiar = useMutation({
    mutationFn: () => authService.restablecerPassword({ token: token ?? "", nuevaPassword: password }),
    onSuccess: (r) => {
      toast.success(r.message || "Contraseña actualizada", { duration: 6000 });
      router.push("/login");
    },
    onError: (err: Error) => {
      if (esCodigo(err, "PASSWORD_INVALIDA", "VALIDACION")) setErrorPassword(err.message);
      else setErrorEnlace(err.message);
    },
  });

  if (!token || errorEnlace) {
    return (
      <div className={`${cardClass} max-w-md text-center`}>
        <Alert tone="error" title="Este enlace no sirve.">
          {errorEnlace ?? "Falta el código del enlace. Ábrelo directamente desde el correo."}
        </Alert>
        <Link
          href="/olvide-password"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-verde px-6 text-sm font-bold text-white hover:bg-verde-oscuro"
        >
          Pedir un código nuevo
        </Link>
      </div>
    );
  }

  return (
    <div className={`${cardClass} max-w-md`}>
      <div className="mb-6 text-center">
        <KeyRound className="mx-auto h-10 w-10 text-verde" aria-hidden="true" />
        <h1 className="mt-2 text-2xl font-extrabold">Elige una contraseña nueva</h1>
        <p className="mt-1 text-sm text-sobre-variante">Al cambiarla se cerrará tu sesión en todos tus dispositivos.</p>
      </div>
      <form
        noValidate
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          setErrorPassword(null);
          cambiar.mutate();
        }}
        className="flex flex-col gap-4"
      >
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
        <Button type="submit" loading={cambiar.isPending} disabled={!passwordLista(password, confirmar)}>
          Guardar contraseña
        </Button>
      </form>
    </div>
  );
}
