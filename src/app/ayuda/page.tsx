import type { Metadata } from "next";
import Link from "next/link";
import {
  CircleCheck,
  ClipboardCheck,
  Clock,
  FileQuestion,
  Hourglass,
  KeyRound,
  LifeBuoy,
  ListChecks,
  MailCheck,
  MailPlus,
  MessageCircleQuestion,
  Send,
  ShieldCheck,
  Smartphone,
  Ticket,
  UserRoundX,
  UserSearch,
} from "lucide-react";

import { ButtonLink, PageContainer } from "@/components/ui";
import { EncabezadoInfo, ListaInfo, Pregunta, SeccionInfo, TarjetaInfo } from "@/features/informacion/Bloques";

export const metadata: Metadata = {
  title: "Ayuda con tickets | Control TIC",
  description:
    "Cómo pedir al área de TIC que restablezca la contraseña de tu correo institucional o tu método de autenticación.",
};

/** Pasos del flujo, iguales a los estados de la Mesa de Ayuda (features/mesa-ayuda/flujo.ts). */
const PASOS = [
  {
    Icono: Send,
    titulo: "Envía tu solicitud",
    texto: "Inicia sesión, entra a Mesa de Ayuda y pulsa \"Nueva solicitud\". Elige qué necesitas y explica brevemente lo que pasó.",
  },
  {
    Icono: UserSearch,
    titulo: "TIC la revisa",
    texto: "El personal de TIC la aprueba o la rechaza con un motivo. Si la rechazan, puedes reenviarla con más información.",
  },
  {
    Icono: ClipboardCheck,
    titulo: "Completa tus datos",
    texto: "Si la aprueban, llena el formulario con tus datos. Puedes corregirlos mientras TIC no tome tu solicitud.",
  },
  {
    Icono: Ticket,
    titulo: "TIC genera el ticket",
    texto: "TIC registra tu caso en la plataforma de soporte de la universidad y verás el número de ticket en tu solicitud.",
  },
  {
    Icono: MailCheck,
    titulo: "Recibe la solución",
    texto: "Cuando la plataforma lo resuelve, la solicitud se cierra con el ID de resolución. Revisa tu correo para seguir las instrucciones.",
  },
] as const;

/**
 * Pasos cuando la persona no puede registrarse (no tiene acceso a su correo institucional):
 * solicitud externa abierta por TIC (backend v4.5, SolicitudExternaService). Enlace de 72 h.
 */
const PASOS_SIN_CUENTA = [
  {
    Icono: UserSearch,
    titulo: "Acude o comunícate con el Área de TIC",
    texto:
      "Explica que no puedes entrar a tu correo institucional y por eso no puedes registrarte. Da tu nombre completo, un correo personal al que sí tengas acceso (Gmail, Outlook…) y qué necesitas.",
  },
  {
    Icono: MailPlus,
    titulo: "TIC abre la solicitud por ti",
    texto:
      "El personal de TIC registra la solicitud a tu nombre y te envía a ese correo personal un enlace para llenar tus datos. Si no lo ves, revisa la carpeta de correo no deseado o spam.",
  },
  {
    Icono: ClipboardCheck,
    titulo: "Llena el formulario desde el enlace",
    texto:
      "No necesitas cuenta ni contraseña: el enlace abre directamente el formulario. Te pedirá los mismos datos de la sección \"Ten a la mano\". Puedes corregirlos mientras TIC no empiece a atender tu solicitud.",
  },
  {
    Icono: Ticket,
    titulo: "TIC genera el ticket",
    texto: "Con tus datos, TIC registra el caso en la plataforma de soporte de la universidad, igual que en cualquier otra solicitud.",
  },
  {
    Icono: MailCheck,
    titulo: "Recibe el resultado por correo",
    texto:
      "Como no tienes cuenta, no verás el seguimiento en Control TIC: te llegará un correo a tu correo personal cuando la solicitud se resuelva o si se rechaza.",
  },
] as const;

/**
 * Ayuda de la Mesa de Ayuda (pantalla pública, 2026-11-03): qué hacer si
 * perdiste la contraseña del correo institucional o el autenticador, cómo es
 * el proceso y qué datos se piden.
 *
 * Los tipos, límites y validaciones coinciden con el backend v4 (DataSeeder,
 * SolicitudTecnicaService); si cambian, actualizar este texto.
 */
export default function AyudaTicketsPage() {
  return (
    <PageContainer narrow>
      <EncabezadoInfo
        eyebrow="Mesa de Ayuda"
        titulo="¿Perdiste el acceso a tu cuenta institucional?"
        descripcion="Si olvidaste la contraseña de tu correo institucional o cambiaste de teléfono y ya no tienes el autenticador, el área de TIC puede ayudarte a restablecerlos. Así funciona."
        Icono={LifeBuoy}
      />

      <SeccionInfo id="que-necesitas" titulo="¿Qué necesitas?" Icono={FileQuestion}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TarjetaInfo Icono={KeyRound} titulo="Restablecer la contraseña de tu correo" tono="verde">
            Olvidaste la contraseña de tu correo institucional (@uaemex.mx o @alumno.uaemex.mx) o la cuenta
            te pide cambiarla y no puedes.
          </TarjetaInfo>
          <TarjetaInfo Icono={Smartphone} titulo="Restablecer tu autenticador (MFA)" tono="verde">
            Cambiaste o perdiste tu teléfono y ya no recibes el código de verificación para entrar.
          </TarjetaInfo>
          <TarjetaInfo Icono={MessageCircleQuestion} titulo="Otro problema" tono="verde">
            Cualquier otro problema con los servicios de TIC. Describe con detalle qué falla y desde cuándo.
          </TarjetaInfo>
        </div>
        <div className="mt-4 rounded-2xl border border-info/25 bg-info-claro/60 p-5 text-sm leading-relaxed text-info-oscuro">
          <p className="font-extrabold">¿Olvidaste la contraseña de Control TIC?</p>
          <p className="mt-1">
            Es distinta de la de tu correo institucional y no se pide por la Mesa de Ayuda: se restablece desde la
            pantalla de{" "}
            <Link href="/login" className="font-semibold underline underline-offset-4">
              inicio de sesión
            </Link>
            . Si no encuentras la opción o no puedes entrar a tu correo, acude al área de TIC del Centro
            Universitario.
          </p>
        </div>
      </SeccionInfo>

      <SeccionInfo id="pasos" titulo="Cómo es el proceso" Icono={ListChecks}>
        <ol className="flex flex-col gap-3">
          {PASOS.map(({ Icono, titulo, texto }, i) => (
            <li key={titulo} className="flex gap-4 rounded-2xl border border-variante bg-white p-4">
              <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-verde text-white">
                <span className="text-[10px] font-bold leading-none text-verde-claro">PASO</span>
                <span className="text-lg font-extrabold leading-none">{i + 1}</span>
              </span>
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-base font-extrabold">
                  <Icono className="h-4 w-4 text-verde" aria-hidden="true" />
                  {titulo}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-sobre-variante">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[13px] text-sobre-variante">
          Cada avance aparece en tu solicitud y como aviso en la campana de la barra superior.
        </p>
      </SeccionInfo>

      <SeccionInfo id="sin-cuenta" titulo="¿No puedes registrarte en la plataforma?" Icono={UserRoundX}>
        <p className="mb-4 text-sm leading-relaxed text-sobre-variante">
          Para crear una cuenta en Control TIC necesitas abrir tu correo institucional y escribir el código de
          verificación. Si justamente ese es tu problema (olvidaste la contraseña del correo o perdiste el
          autenticador), no te preocupes: el Área de TIC puede levantar el ticket por ti.
        </p>
        <ol className="flex flex-col gap-3">
          {PASOS_SIN_CUENTA.map(({ Icono, titulo, texto }, i) => (
            <li key={titulo} className="flex gap-4 rounded-2xl border border-variante bg-white p-4">
              <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-dorado text-dorado-oscuro">
                <span className="text-[10px] font-bold leading-none">PASO</span>
                <span className="text-lg font-extrabold leading-none">{i + 1}</span>
              </span>
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-base font-extrabold">
                  <Icono className="h-4 w-4 text-verde" aria-hidden="true" />
                  {titulo}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-sobre-variante">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex gap-3 rounded-2xl border border-alerta/30 bg-alerta-claro p-5 text-sm leading-relaxed text-alerta-oscuro">
          <Hourglass className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-extrabold">El enlace vence en 72 horas.</p>
            <p className="mt-1">
              Si no envías tus datos antes de que venza, la solicitud se rechaza automáticamente. Si te pasa, pide al
              Área de TIC que te envíe un enlace nuevo. El enlace es personal: no lo compartas, y usa siempre el del
              último correo que recibiste (los anteriores dejan de funcionar).
            </p>
          </div>
        </div>
      </SeccionInfo>

      <SeccionInfo id="ten-a-la-mano" titulo="Ten a la mano" Icono={ClipboardCheck}>
        <div className="rounded-2xl border border-dorado/30 bg-dorado-claro p-5 text-sm leading-relaxed text-dorado-oscuro">
          <p className="mb-3 font-semibold">Para generar el ticket, el formulario te pedirá:</p>
          <ListaInfo
            elementos={[
              "Tu nombre completo, tal como aparece en tus documentos.",
              "Tu correo institucional (@uaemex.mx o @alumno.uaemex.mx).",
              "Un correo alterno distinto, al que sí puedas entrar: ahí te pueden llegar las instrucciones.",
              "Tu número de cuenta (7 dígitos).",
              "Tu CURP (18 caracteres).",
              "Un teléfono de contacto (10 dígitos).",
              "Una descripción del problema.",
            ]}
          />
        </div>
      </SeccionInfo>

      <SeccionInfo id="reglas" titulo="Reglas para todos" Icono={Clock}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TarjetaInfo Icono={ListChecks} titulo="Hasta 3 activas">
            Puedes tener hasta 3 solicitudes en proceso al mismo tiempo.
          </TarjetaInfo>
          <TarjetaInfo Icono={Clock} titulo="8 horas entre iguales">
            Debes esperar 8 horas para enviar otra solicitud del mismo tipo.
          </TarjetaInfo>
          <TarjetaInfo Icono={CircleCheck} titulo="Cancela a tiempo">
            Puedes cancelar tu solicitud mientras TIC no haya empezado a generar el ticket.
          </TarjetaInfo>
        </div>
      </SeccionInfo>

      <SeccionInfo id="preguntas" titulo="Preguntas frecuentes" Icono={MessageCircleQuestion}>
        <div className="flex flex-col gap-2.5">
          <Pregunta pregunta="¿Por qué me piden mi CURP y mi número de cuenta?">
            La plataforma de soporte de la universidad los usa para confirmar que la cuenta es tuya antes de
            restablecerla. Tu CURP se guarda cifrada y en pantalla aparece enmascarada. Consulta{" "}
            <Link href="/privacidad" className="font-semibold text-verde underline underline-offset-4">
              Privacidad de tus datos
            </Link>
            .
          </Pregunta>
          <Pregunta pregunta="¿Cuánto tarda?">
            Depende de la carga de la plataforma de soporte de la universidad. Verás cada avance en tu
            solicitud: cuando TIC la revise, cuando genere el ticket (con su número) y cuando quede resuelta.
          </Pregunta>
          <Pregunta pregunta="Rechazaron mi solicitud, ¿qué hago?">
            Abre la solicitud para ver el motivo y usa &quot;Reenviar con más información&quot;. Vuelve a revisión
            sin que tengas que crear otra.
          </Pregunta>
          <Pregunta pregunta="Me equivoqué en un dato del formulario.">
            Puedes corregirlo desde tu solicitud mientras TIC no la haya tomado. Por seguridad, escribe tu CURP
            completa de nuevo al guardar.
          </Pregunta>
          <Pregunta pregunta="No puedo entrar a ningún correo, ¿cómo recibo las instrucciones?">
            Escribe en el formulario un correo alterno al que sí tengas acceso (personal, por ejemplo). Si no
            tienes ninguno, acude en persona al área de TIC del Centro Universitario.
          </Pregunta>
          <Pregunta pregunta="¿Puedo pedirlo si todavía no tengo cuenta en Control TIC?">
            Sí. Si puedes abrir tu correo institucional, regístrate y crea la solicitud tú mismo. Si no puedes
            abrirlo, acude o comunícate con el Área de TIC: abrirán la solicitud por ti y te enviarán a tu correo
            personal un enlace para llenar tus datos (consulta{" "}
            <a href="#sin-cuenta" className="font-semibold text-verde underline underline-offset-4">
              ¿No puedes registrarte en la plataforma?
            </a>
            ).
          </Pregunta>
          <Pregunta pregunta="Me llegó un correo de TIC con un enlace, pero nunca pedí ayuda.">
            Ignóralo: sin tus datos la solicitud se rechaza sola a las 72 horas. Si recibes correos de este tipo
            con frecuencia, avisa al Área de TIC.
          </Pregunta>
          <Pregunta pregunta="Llené el formulario desde el enlace, ¿cómo sé cómo va mi solicitud?">
            Al abrir de nuevo el enlace verás en qué etapa está (recibida, en atención, resuelta o rechazada).
            El aviso final también te llega por correo.
          </Pregunta>
        </div>
      </SeccionInfo>

      <div className="flex flex-col gap-4 rounded-2xl bg-verde-oscuro p-6 text-superficie sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 shrink-0 text-dorado" aria-hidden="true" />
          <div>
            <p className="font-extrabold">¿Listo para pedir ayuda?</p>
            <p className="text-sm text-verde-claro">
              Inicia sesión y crea tu solicitud en la Mesa de Ayuda. ¿Sin acceso a tu correo? Acude al Área de TIC.
            </p>
          </div>
        </div>
        <ButtonLink href="/solicitudes-tecnicas" variant="accent">
          Crear una solicitud
        </ButtonLink>
      </div>
    </PageContainer>
  );
}
