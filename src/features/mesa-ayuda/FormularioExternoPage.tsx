"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, CircleX, Clock, FileWarning, Pencil, Send, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";

import { Alert, Button } from "@/components/ui";
import { PageLoader } from "@/components/ui/PageLoader";
import { cardClass } from "@/components/ui/styles";
import { ApiError, esCodigo } from "@/lib/api/errors";
import { solicitudTecnicaService } from "@/lib/api/services";
import { formatearFecha } from "@/lib/fechas";
import type { FormularioExterno } from "@/types/api";

import { CamposFormularioDatos } from "./CamposFormularioDatos";
import { formularioSchema, type FormularioValues } from "./schemas";

const clave = (token: string) => ["formulario-externo", token] as const;

/**
 * `/formulario-externo?token=…`: página pública (sin sesión) a la que llega
 * quien no tiene acceso a su correo institucional, desde el enlace que TIC le
 * envió a su correo alterno. Tiene su propio encabezado (NavBar en modo
 * externo): no muestra iniciar sesión ni registro.
 *
 * Mientras TIC no toma la solicitud la persona puede enviar y corregir sus
 * datos; si no los envía antes de que venza el enlace (72 h) la solicitud se
 * rechaza sola. Después solo ve un mensaje con la etapa: el seguimiento
 * no está disponible para ella (recibe un correo al resolverse o rechazarse).
 */
export function FormularioExternoPage() {
  const token = useSearchParams().get("token")?.trim() ?? "";
  const query = useQuery({
    queryKey: clave(token),
    queryFn: () => solicitudTecnicaService.consultarFormularioExterno(token),
    enabled: token.length > 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (!token) {
    return (
      <Aviso icono="error" titulo="Falta el enlace">
        Abre esta página con el botón del correo que te envió el Área de TIC.
      </Aviso>
    );
  }
  if (query.isPending) return <PageLoader />;
  if (query.isError) {
    return (
      <Aviso icono="error" titulo="El enlace no es válido">
        {query.error.message}
      </Aviso>
    );
  }
  const f = query.data;
  if (!f.editable) return <Etapa f={f} />;
  return <Formulario key={f.etapa} token={token} f={f} />;
}

function Formulario({ token, f }: { token: string; f: FormularioExterno }) {
  const queryClient = useQueryClient();
  const enviado = f.etapa === "ENVIADO";
  const [editando, setEditando] = useState(!enviado);
  const d = f.datos;
  const [iniciales] = useState<FormularioValues>(() => ({
    nombreCompleto: d?.nombreCompleto ?? f.nombre,
    correoInstitucional: d?.correoInstitucional ?? "",
    correoAlterno: d?.correoAlterno ?? "",
    numeroCuenta: d?.numeroCuenta ?? "",
    curp: "",
    telefono: d?.telefono ?? "",
    descripcionProblema: d?.descripcionProblema ?? f.motivo ?? "",
  }));

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormularioValues>({ resolver: zodResolver(formularioSchema), defaultValues: iniciales });

  const mutation = useMutation({
    mutationFn: (v: FormularioValues) => solicitudTecnicaService.llenarFormularioExterno(token, v),
    onSuccess: (r) => {
      queryClient.setQueryData(clave(token), r);
      toast.success(enviado ? "Datos actualizados" : "¡Listo! Recibimos tus datos", { duration: 5000 });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err: Error) => {
      if (esCodigo(err, "ENLACE_EXPIRADO", "FORMULARIO_NO_EDITABLE", "ENLACE_INVALIDO")) {
        void queryClient.invalidateQueries({ queryKey: clave(token) });
      }
      if (err instanceof ApiError) {
        for (const [campo, mensaje] of Object.entries(err.detalles)) {
          // Los errores del cuerpo anidado llegan como "formulario.curp"
          const c = campo.replace(/^formulario\./, "");
          if (c in iniciales) setError(c as keyof FormularioValues, { message: mensaje });
        }
      }
      toast.error(err.message);
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-8">
      <Encabezado f={f} />

      {enviado ? (
        <Alert tone="ok" title="Recibimos tus datos.">
          El Área de TIC generará tu ticket. Puedes corregirlos mientras no empiecen a atender tu solicitud. Te
          avisaremos a tu correo alterno cuando se resuelva.
        </Alert>
      ) : (
        <Alert tone="alerta" title="Debes enviar tus datos para continuar.">
          {f.enlaceExpira ? (
            <>
              Llena el formulario antes del <strong>{formatearFecha(f.enlaceExpira)}</strong>.
            </>
          ) : (
            "Llena el formulario lo antes posible."
          )}{" "}
          Si no recibimos tus datos, <strong>la solicitud será rechazada automáticamente</strong>.
        </Alert>
      )}

      {enviado && !editando ? (
        <div>
          <Button variant="secondary" icon={<Pencil className="h-4 w-4" aria-hidden="true" />} onClick={() => setEditando(true)}>
            Corregir mis datos
          </Button>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className={`${cardClass} flex flex-col gap-4`}
          aria-labelledby="titulo-datos-externo"
        >
          <div>
            <h2 id="titulo-datos-externo" className="text-base font-extrabold">
              {enviado ? "Corrige tus datos" : "Tus datos para el ticket"}
            </h2>
            <p className="mt-1 text-[13px] text-sobre-variante">
              Se usan solo para registrar tu solicitud en la plataforma de soporte de la universidad.
            </p>
          </div>
          <CamposFormularioDatos
            register={register}
            errors={errors}
            hintCurp={
              d?.tieneCurp
                ? "Ya la registraste. Por seguridad escríbela completa de nuevo para guardar cambios."
                : "Tal como aparece en tu documento oficial. Se guarda cifrada."
            }
            hintCorreoAlterno="Al que sí tienes acceso. Ahí te avisaremos cuando se resuelva la solicitud."
          />
          <p className="flex items-start gap-2 text-[12px] text-sobre-variante">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-verde" aria-hidden="true" />
            Este enlace es personal: no lo compartas. No necesitas crear una cuenta.
          </p>
          <div className="flex flex-wrap justify-end gap-2.5">
            {enviado && (
              <Button variant="secondary" onClick={() => setEditando(false)} disabled={mutation.isPending}>
                Cancelar
              </Button>
            )}
            <Button type="submit" loading={mutation.isPending} icon={<Send className="h-4 w-4" aria-hidden="true" />}>
              {enviado ? "Guardar cambios" : "Enviar mis datos"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function Encabezado({ f }: { f: FormularioExterno }) {
  return (
    <div>
      <p className="text-xs font-extrabold tracking-[0.06em] text-dorado-texto">Solicitud #{f.folio} · {f.tipo}</p>
      <h1 className="mt-1 text-2xl font-extrabold">Hola, {f.nombre}</h1>
      <p className="mt-1 text-sm text-sobre-variante">
        El Área de TIC abrió esta solicitud a tu nombre porque no tienes acceso a tu correo institucional.
      </p>
      {f.motivo && (
        <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm leading-relaxed text-sobre-variante ring-1 ring-variante">
          {f.motivo}
        </p>
      )}
    </div>
  );
}

/** Ya no editable: solo la etapa (no hay seguimiento para quien no tiene cuenta). */
function Etapa({ f }: { f: FormularioExterno }) {
  const tipo =
    f.etapa === "RESUELTA" ? "ok" : f.etapa === "EN_ATENCION" ? "espera" : f.etapa === "VENCIDO" ? "vencido" : "error";
  const titulo: Record<string, string> = {
    EN_ATENCION: "Tu solicitud está en atención",
    RESUELTA: "Solicitud resuelta",
    RECHAZADA: "Solicitud rechazada",
    CANCELADA: "Solicitud cancelada",
    VENCIDO: "El enlace venció",
  };
  return (
    <Aviso icono={tipo} titulo={titulo[f.etapa] ?? "Solicitud"} subtitulo={`Solicitud #${f.folio} · ${f.tipo}`}>
      {f.mensaje}
    </Aviso>
  );
}

function Aviso({
  icono,
  titulo,
  subtitulo,
  children,
}: {
  icono: "ok" | "espera" | "vencido" | "error";
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  const Icono = { ok: CircleCheck, espera: Clock, vencido: FileWarning, error: CircleX }[icono];
  const color = { ok: "text-verde", espera: "text-dorado-texto", vencido: "text-alerta", error: "text-error" }[icono];
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className={`${cardClass} max-w-md text-center`}>
        <Icono className={`mx-auto h-10 w-10 ${color}`} aria-hidden="true" />
        {subtitulo && <p className="mt-3 text-xs font-extrabold tracking-[0.06em] text-dorado-texto">{subtitulo}</p>}
        <h1 className="mt-1 text-xl font-extrabold">{titulo}</h1>
        <p className="mt-2 text-sm leading-relaxed text-sobre-variante">{children}</p>
        <p className="mt-5 border-t border-variante pt-4 text-[12px] text-outline">
          Área de TIC · UAEM Tianguistenco. No necesitas cuenta para esta solicitud.
        </p>
      </div>
    </div>
  );
}
