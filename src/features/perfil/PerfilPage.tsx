"use client";

import { useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Mail, Save, Trash2, UserRound } from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";

import {
  Alert,
  Button,
  Card,
  CardHeader,
  FormField,
  Input,
  Modal,
  PageContainer,
  PageHeader,
  PageLoader,
  PasswordChecklist,
} from "@/components/ui";
import { esCodigo } from "@/lib/api/errors";
import { perfilService } from "@/lib/api/services";
import { formatearFechaHora } from "@/lib/fechas";
import { passwordSchema } from "@/lib/validation/password";
import { useAuthStore } from "@/store/authStore";
import type { ResumenEliminacion, Usuario } from "@/types/api";

const claves = {
  perfil: ["perfil"] as const,
  eliminacion: ["perfil", "eliminacion"] as const,
};

/**
 * Mi perfil (`/perfil`, cualquier rol con sesión):
 * - Datos personales: nombre y apellidos.
 * - Correo electrónico (cualquier rol, 2026-11-03): cambio directo con la contraseña;
 *   debe ser institucional y no estar en uso. El rol no cambia.
 * - Cambiar contraseña: cierra las sesiones en otros dispositivos.
 * - Eliminar cuenta: solo Profesor y Estudiante. Antes muestra qué se cancelará
 *   (reservas futuras, solicitudes sin ticket) y pide la contraseña.
 */
export function PerfilPage() {
  const perfil = useQuery({ queryKey: claves.perfil, queryFn: perfilService.obtener });

  return (
    <PageContainer narrow>
      <PageHeader eyebrow="Cuenta" title="Mi perfil" description="Consulta y actualiza los datos de tu cuenta." />
      {perfil.isPending ? (
        <PageLoader label="Cargando perfil..." />
      ) : perfil.isError ? (
        <Alert tone="error">{perfil.error.message}</Alert>
      ) : (
        <>
          <DatosPersonales usuario={perfil.data} />
          <CambiarCorreo key={perfil.data.correo} usuario={perfil.data} />
          <CambiarPassword />
          <EliminarCuenta />
        </>
      )}
    </PageContainer>
  );
}

/* ================================================================
 * Datos personales
 * ================================================================ */

const datosSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
  apellidos: z.string().trim().max(100, "Máximo 100 caracteres"),
});
type DatosValues = z.infer<typeof datosSchema>;

function DatosPersonales({ usuario }: { usuario: Usuario }) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<DatosValues>({
    resolver: zodResolver(datosSchema),
    defaultValues: { nombre: usuario.nombre, apellidos: usuario.apellidos ?? "" },
  });

  const guardar = useMutation({
    mutationFn: (v: DatosValues) => perfilService.actualizar({ nombre: v.nombre, apellidos: v.apellidos || null }),
    onSuccess: (u) => {
      queryClient.setQueryData(claves.perfil, u);
      setUser(u); // la barra superior muestra el nombre nuevo
      reset({ nombre: u.nombre, apellidos: u.apellidos ?? "" });
      toast.success("Datos actualizados");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-verde" aria-hidden="true" />
            Datos personales
          </span>
        }
      />
      <form noValidate onSubmit={handleSubmit((v) => guardar.mutate(v))} className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Nombre" required error={errors.nombre?.message}>
            {(a11y) => <Input {...a11y} autoComplete="given-name" {...register("nombre")} />}
          </FormField>
          <FormField label="Apellidos" error={errors.apellidos?.message}>
            {(a11y) => <Input {...a11y} autoComplete="family-name" {...register("apellidos")} />}
          </FormField>
        </div>
        <dl className="grid grid-cols-1 gap-3 rounded-xl bg-superficie p-4 text-sm sm:grid-cols-3">
          <Dato etiqueta="Rol">{usuario.nombreRol === "Estudiante" ? "Alumno" : usuario.nombreRol}</Dato>
          <Dato etiqueta="Cuenta creada">{formatearFechaHora(usuario.fechaCreacion)}</Dato>
          <Dato etiqueta="Último acceso">{formatearFechaHora(usuario.ultimoAcceso)}</Dato>
        </dl>
        <p className="text-[13px] text-sobre-variante">
          El rol lo asigna el Área de TIC; si es incorrecto, solicita el cambio.
        </p>
        <div className="flex justify-end">
          <Button type="submit" loading={guardar.isPending} disabled={!isDirty} icon={<Save className="h-4 w-4" aria-hidden="true" />}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ================================================================
 * Correo electrónico (cualquier rol)
 * ================================================================ */

const DOMINIOS = ["uaemex.mx", "alumno.uaemex.mx"] as const;

const correoSchema = z.object({
  correoNuevo: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Escribe el correo nuevo")
    .max(254, "El correo es demasiado largo")
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Correo no válido")
    .refine((v) => DOMINIOS.some((d) => v.endsWith(`@${d}`)), "Usa tu correo institucional (@uaemex.mx o @alumno.uaemex.mx)"),
  password: z.string().min(1, "Confirma con tu contraseña"),
});
type CorreoValues = z.infer<typeof correoSchema>;

function CambiarCorreo({ usuario }: { usuario: Usuario }) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CorreoValues>({ resolver: zodResolver(correoSchema), defaultValues: { correoNuevo: "", password: "" } });

  const cambiar = useMutation({
    mutationFn: (v: CorreoValues) => perfilService.cambiarCorreo(v.correoNuevo, v.password),
    onSuccess: (u) => {
      queryClient.setQueryData(claves.perfil, u);
      setUser(u);
      reset();
      toast.success(`Listo. Desde ahora inicias sesión con ${u.correo}`, { duration: 6000 });
    },
    onError: (err: Error) => {
      if (esCodigo(err, "PASSWORD_ACTUAL_INCORRECTA")) {
        setError("password", { message: err.message });
      } else if (esCodigo(err, "CORREO_REGISTRADO", "CORREO_NO_INSTITUCIONAL", "CORREO_SIN_CAMBIO", "CORREO_INVALIDO")) {
        setError("correoNuevo", { message: err.message });
      } else {
        toast.error(err.message);
      }
    },
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-verde" aria-hidden="true" />
            Correo electrónico
          </span>
        }
        description="Es el correo con el que inicias sesión y al que se envían los avisos de tu cuenta."
      />
      <form noValidate onSubmit={handleSubmit((v) => cambiar.mutate(v))} className="flex flex-col gap-4 p-6">
        <div className="rounded-xl bg-superficie px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-sobre-variante">Correo actual</p>
          <p className="mt-0.5 break-all text-[15px] font-bold">{usuario.correo}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Correo nuevo"
            required
            error={errors.correoNuevo?.message}
            hint="Debe ser institucional: @uaemex.mx o @alumno.uaemex.mx."
          >
            {(a11y) => <Input {...a11y} type="email" autoComplete="email" {...register("correoNuevo")} />}
          </FormField>
          <FormField label="Tu contraseña" required error={errors.password?.message} hint="Para confirmar que eres tú.">
            {(a11y) => <Input {...a11y} type="password" autoComplete="current-password" {...register("password")} />}
          </FormField>
        </div>
        <Alert tone="info">
          El cambio es inmediato: la próxima vez inicia sesión con el correo nuevo. Tu rol no cambia; revisa que
          el correo esté bien escrito.
        </Alert>
        <div className="flex justify-end">
          <Button type="submit" loading={cambiar.isPending} icon={<Mail className="h-4 w-4" aria-hidden="true" />}>
            Cambiar correo
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ================================================================
 * Cambiar contraseña
 * ================================================================ */

const passwordFormSchema = z
  .object({
    passwordActual: z.string().min(1, "Escribe tu contraseña actual"),
    passwordNueva: passwordSchema,
    confirmar: z.string().min(1, "Confirma la nueva contraseña"),
  })
  .refine((v) => v.passwordNueva === v.confirmar, { path: ["confirmar"], message: "Las contraseñas no coinciden" })
  .refine((v) => v.passwordNueva !== v.passwordActual, {
    path: ["passwordNueva"],
    message: "La nueva contraseña debe ser distinta de la actual",
  });
type PasswordValues = z.infer<typeof passwordFormSchema>;

function CambiarPassword() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { passwordActual: "", passwordNueva: "", confirmar: "" },
  });
  const nueva = useWatch({ control, name: "passwordNueva" });

  const cambiar = useMutation({
    mutationFn: (v: PasswordValues) =>
      perfilService.cambiarPassword({ passwordActual: v.passwordActual, passwordNueva: v.passwordNueva }),
    onSuccess: (r) => {
      reset();
      toast.success(r.message || "Contraseña actualizada", { duration: 6000 });
    },
    onError: (err: Error) => {
      if (esCodigo(err, "PASSWORD_ACTUAL_INCORRECTA")) {
        setError("passwordActual", { message: err.message });
      } else if (esCodigo(err, "PASSWORD_INVALIDA")) {
        setError("passwordNueva", { message: err.message });
      } else {
        toast.error(err.message);
      }
    },
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-verde" aria-hidden="true" />
            Cambiar contraseña
          </span>
        }
        description="Se cerrará tu sesión en los demás dispositivos; en este seguirás conectado."
      />
      <form noValidate onSubmit={handleSubmit((v) => cambiar.mutate(v))} className="flex flex-col gap-4 p-6">
        <FormField label="Contraseña actual" required error={errors.passwordActual?.message}>
          {(a11y) => <Input {...a11y} type="password" autoComplete="current-password" {...register("passwordActual")} />}
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Nueva contraseña" required error={errors.passwordNueva?.message}>
            {(a11y) => <Input {...a11y} type="password" autoComplete="new-password" {...register("passwordNueva")} />}
          </FormField>
          <FormField label="Confirmar nueva contraseña" required error={errors.confirmar?.message}>
            {(a11y) => <Input {...a11y} type="password" autoComplete="new-password" {...register("confirmar")} />}
          </FormField>
        </div>
        <PasswordChecklist value={nueva ?? ""} />
        <div className="flex justify-end">
          <Button type="submit" loading={cambiar.isPending} icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}>
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ================================================================
 * Eliminar cuenta (Profesor y Estudiante)
 * ================================================================ */

function EliminarCuenta() {
  const [confirmando, setConfirmando] = useState(false);
  const resumen = useQuery({ queryKey: claves.eliminacion, queryFn: perfilService.resumenEliminacion });

  // Admin y Operador: la sección no se muestra (los elimina otro Admin).
  if (resumen.isPending || resumen.isError || !resumen.data.puedeEliminar) {
    return resumen.data && !resumen.data.puedeEliminar ? (
      <p className="text-center text-[13px] text-sobre-variante">{resumen.data.motivoNoPermitido}</p>
    ) : null;
  }

  return (
    <Card className="overflow-hidden border-error-claro">
      <CardHeader
        title={
          <span className="flex items-center gap-2 text-error-oscuro">
            <Trash2 className="h-5 w-5" aria-hidden="true" />
            Eliminar mi cuenta
          </span>
        }
        description="Se borran tus datos personales y ya no podrás iniciar sesión. No se puede deshacer."
      />
      <div className="flex flex-col gap-4 p-6">
        <QueSeCancela r={resumen.data} />
        <div className="flex justify-end">
          <Button variant="danger-outline" icon={<Trash2 className="h-4 w-4" aria-hidden="true" />} onClick={() => setConfirmando(true)}>
            Eliminar mi cuenta
          </Button>
        </div>
      </div>
      <ConfirmarEliminacion open={confirmando} resumen={resumen.data} onClose={() => setConfirmando(false)} />
    </Card>
  );
}

function QueSeCancela({ r }: { r: ResumenEliminacion }) {
  const items = [
    r.reservasFuturas > 0 && `${r.reservasFuturas} reserva(s) de sala a partir de hoy se cancelarán.`,
    r.solicitudesReservaPendientes > 0 && `${r.solicitudesReservaPendientes} solicitud(es) de reserva pendientes se cancelarán.`,
    r.solicitudesTecnicasActivas > 0 &&
      `${r.solicitudesTecnicasActivas} solicitud(es) de la mesa de ayuda sin ticket se cancelarán.`,
    r.ticketsEnPlataforma > 0 &&
      `${r.ticketsEnPlataforma} solicitud(es) con ticket en la DTIC se conservan para que la atiendan, pero ya no recibirás avisos.`,
  ].filter(Boolean) as string[];
  if (items.length === 0) {
    return <p className="text-sm text-sobre-variante">No tienes reservas ni solicitudes pendientes.</p>;
  }
  return (
    <Alert tone="alerta" title="Al eliminar tu cuenta:">
      <ul className="list-disc pl-5">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </Alert>
  );
}

const PALABRA = "ELIMINAR";

function ConfirmarEliminacion({ open, resumen, onClose }: { open: boolean; resumen: ResumenEliminacion; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title="¿Eliminar tu cuenta?" description="Esta acción no se puede deshacer.">
      {open && <FormEliminar resumen={resumen} onClose={onClose} />}
    </Modal>
  );
}

function FormEliminar({ resumen, onClose }: { resumen: ResumenEliminacion; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [palabra, setPalabra] = useState("");
  const [error, setError] = useState<string | null>(null);

  const eliminar = useMutation({
    mutationFn: () => perfilService.eliminarCuenta(password),
    onSuccess: () => {
      useAuthStore.setState({ user: null });
      toast.success("Tu cuenta se eliminó");
      // Recarga completa para no conservar datos del usuario en memoria (Cache Components)
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa intencional
      window.location.assign("/");
    },
    onError: (err: Error) => {
      if (esCodigo(err, "PASSWORD_ACTUAL_INCORRECTA")) setError(err.message);
      else toast.error(err.message);
    },
  });

  const listo = password.length > 0 && palabra.trim().toUpperCase() === PALABRA;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (listo) eliminar.mutate();
      }}
      className="flex flex-col gap-4"
    >
      <QueSeCancela r={resumen} />
      <FormField label="Tu contraseña" required error={error ?? undefined}>
        {(a11y) => (
          <Input
            {...a11y}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
          />
        )}
      </FormField>
      <FormField label={`Escribe ${PALABRA} para confirmar`} required>
        {(a11y) => <Input {...a11y} autoComplete="off" value={palabra} onChange={(e) => setPalabra(e.target.value)} />}
      </FormField>
      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={eliminar.isPending}>
          Cancelar
        </Button>
        <Button type="submit" variant="danger" loading={eliminar.isPending} disabled={!listo} icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}>
          Eliminar definitivamente
        </Button>
      </div>
    </form>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-sobre-variante">{etiqueta}</dt>
      <dd className="mt-0.5 break-words font-semibold">{children}</dd>
    </div>
  );
}
