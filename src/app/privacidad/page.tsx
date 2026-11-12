import type { Metadata } from "next";
import {
  CalendarClock,
  ClipboardList,
  Eye,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ScrollText,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";

import { ButtonLink, PageContainer } from "@/components/ui";
import { EncabezadoInfo, ListaInfo, SeccionInfo, TarjetaInfo } from "@/features/publico";

export const metadata: Metadata = {
  title: "Privacidad de tus datos | Control TIC",
  description: "Qué datos usa Control TIC, para qué y cómo se protegen.",
};

/**
 * Privacidad de los datos (pantalla pública, decisión 2026-11-03: solo
 * informativa, sin apartado legal). Explica en lenguaje sencillo qué datos
 * guarda el sistema y cómo los protege el backend v4.
 *
 * Mantener alineado con el backend: si cambia el cifrado, la retención o
 * quién puede consultar un dato, actualizar este texto (AGENTS.md §7 del backend).
 */
export default function PrivacidadPage() {
  return (
    <PageContainer narrow>
      <EncabezadoInfo
        eyebrow="Centro Universitario UAEM Tianguistenco"
        titulo="Privacidad de tus datos"
        descripcion="Control TIC solo pide los datos necesarios para darte el servicio. Aquí te explicamos cuáles son, para qué se usan y cómo se protegen."
        Icono={ShieldCheck}
      />

      <SeccionInfo id="que-datos" titulo="Qué datos usamos y para qué" Icono={ClipboardList}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TarjetaInfo Icono={UserRound} titulo="Tu cuenta">
            Nombre, apellidos, correo institucional y rol. Sirven para iniciar sesión, mostrarte solo lo que
            te corresponde y enviarte avisos dentro del sistema.
          </TarjetaInfo>
          <TarjetaInfo Icono={CalendarClock} titulo="Reservas de salas">
            Sala, fecha, horario y propósito de cada reserva o solicitud. Sirven para organizar la agenda y
            avisarte si hay cambios.
          </TarjetaInfo>
          <TarjetaInfo Icono={Wrench} titulo="Mesa de Ayuda" tono="dorado">
            Número de cuenta, CURP, teléfono, correo alterno y la descripción del problema. Se usan{" "}
            <strong className="text-dorado-oscuro">solo para generar tu ticket</strong> en la plataforma de
            soporte de la universidad y comprobar que la cuenta es tuya.
          </TarjetaInfo>
          <TarjetaInfo Icono={ScrollText} titulo="Registro de actividad">
            Fecha, hora, acción realizada y dirección IP de las operaciones importantes (inicios de sesión,
            cambios y consultas de datos sensibles). Sirve para la seguridad del sistema.
          </TarjetaInfo>
        </div>
      </SeccionInfo>

      <SeccionInfo id="como-protegemos" titulo="Cómo los protegemos" Icono={LockKeyhole}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TarjetaInfo Icono={KeyRound} titulo="Tu contraseña" tono="verde">
            Se guarda de forma irreversible (BCrypt): nadie, ni el personal de TIC, puede verla. Si la
            olvidas, se restablece; no se recupera.
          </TarjetaInfo>
          <TarjetaInfo Icono={Fingerprint} titulo="Tu CURP" tono="verde">
            Se guarda cifrada y en pantalla aparece enmascarada. Solo el personal de TIC puede consultarla
            completa para generar tu ticket, y cada consulta queda registrada.
          </TarjetaInfo>
          <TarjetaInfo Icono={LockKeyhole} titulo="Tu sesión" tono="verde">
            Se mantiene con cookies protegidas que el navegador no deja leer a otros programas. Caduca sola
            y se bloquea tras 5 intentos fallidos de contraseña.
          </TarjetaInfo>
          <TarjetaInfo Icono={Eye} titulo="Consultas registradas" tono="verde">
            Ver datos sensibles, cambiarlos o descargarlos deja un registro de quién lo hizo y cuándo.
          </TarjetaInfo>
        </div>
      </SeccionInfo>

      <SeccionInfo id="quien-ve" titulo="Quién puede verlos" Icono={UsersRound}>
        <div className="rounded-2xl border border-variante bg-white p-5 text-sm leading-relaxed text-sobre-variante">
          <ListaInfo
            elementos={[
              <>
                <strong className="text-sobre-superficie">Tú</strong>: tus datos de cuenta, tus reservas y tus
                solicitudes.
              </>,
              <>
                <strong className="text-sobre-superficie">El personal del área de TIC</strong> (Administración
                y Operadores): lo necesario para atender tus reservas y solicitudes.
              </>,
              <>
                <strong className="text-sobre-superficie">La plataforma de soporte de la universidad</strong>:
                los datos de tu solicitud técnica, cuando TIC genera el ticket.
              </>,
              <>Ningún otro usuario del sistema puede ver tus datos personales.</>,
            ]}
          />
        </div>
      </SeccionInfo>

      <SeccionInfo id="cuanto-tiempo" titulo="Cuánto tiempo se guardan" Icono={Trash2}>
        <div className="rounded-2xl border border-variante bg-white p-5 text-sm leading-relaxed text-sobre-variante">
          <ListaInfo
            elementos={[
              "Tus datos de cuenta, mientras la cuenta exista.",
              "Las notificaciones que ya leíste se borran solas a los 90 días.",
              "Si se elimina tu cuenta, tu nombre y tu correo se reemplazan, se cierran tus sesiones y ya no se puede iniciar sesión con ella. El historial de reservas y solicitudes se conserva para el control del área de TIC.",
            ]}
          />
        </div>
      </SeccionInfo>

      <div className="flex flex-col gap-4 rounded-2xl bg-superficie p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-extrabold">¿Tienes dudas sobre tus datos?</p>
          <p className="mt-1 text-sm text-sobre-variante">
            Acude al área de TIC del Centro Universitario. El aviso de privacidad institucional está en{" "}
            <a
              href="https://www.uaemex.mx/avisos/Aviso_Privacidad.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-verde underline underline-offset-4 hover:text-dorado-texto"
            >
              uaemex.mx
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
            .
          </p>
        </div>
        <ButtonLink href="/ayuda" variant="secondary">
          Ayuda con tickets
        </ButtonLink>
      </div>
    </PageContainer>
  );
}
