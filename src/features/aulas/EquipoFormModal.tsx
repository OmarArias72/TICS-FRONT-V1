"use client";

import { useId, useState, type ReactNode } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, Save } from "lucide-react";
import { toast } from "react-hot-toast";

import { Alert, Button, FormField, Input, Modal, Select, Textarea } from "@/components/ui";
import { usePermiso } from "@/features/auth/usePermiso";
import { equipoComputoService } from "@/lib/api/services";
import type { ContrasenasEquipo, EquipoComputo, EquipoComputoRequest, Sala } from "@/types/api";

import { CLAVES_INVENTARIO, clavesAulas } from "./claves";
import { OPCIONES } from "./equipos";
import { equipoComputoSchema, type EquipoComputoValues } from "./schemas";

interface EquipoFormModalProps {
  open: boolean;
  /** null para registrar un equipo nuevo en `salaInicial`. */
  equipo: EquipoComputo | null;
  salaInicial: Sala;
  salas: Sala[];
  onClose: () => void;
  /** Se llama con el equipo guardado (para seleccionarlo en la cuadrícula). */
  onGuardado?: (equipo: EquipoComputo) => void;
}

/** Registrar o editar una PC (antes ComputerFormModal.jsx). Permiso: "equipos.gestionar". */
export function EquipoFormModal({ open, equipo, salaInicial, salas, onClose, onGuardado }: EquipoFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={equipo ? `Editar equipo ${equipo.inventario}` : "Registrar equipo"}
      description={equipo ? undefined : `Sala ${salaInicial.codigoSala}${salaInicial.nombre ? ` · ${salaInicial.nombre}` : ""}`}
    >
      {open && (
        <EquipoForm
          key={equipo?.idEquipoComputo ?? "nuevo"}
          equipo={equipo}
          salaInicial={salaInicial}
          salas={salas}
          onClose={onClose}
          onGuardado={onGuardado}
        />
      )}
    </Modal>
  );
}

function valoresIniciales(equipo: EquipoComputo | null, salaInicial: Sala): EquipoComputoValues {
  const e = equipo;
  return {
    inventario: e?.inventario ?? "",
    serie: e?.serie ?? "",
    nombreArticulo: e?.nombreArticulo ?? "Computadora",
    nombreMarca: e?.nombreMarca ?? "",
    nombreModelo: e?.nombreModelo ?? "",
    caracteristicas: e?.caracteristicas ?? "",
    estado: (e?.estado as EquipoComputoValues["estado"] | undefined) ?? "ALTA",
    idSala: String(e?.idSala ?? salaInicial.idSala),
    procesador: e?.procesador ?? "",
    ram: e?.ram ?? "",
    almacenamiento: e?.almacenamiento ?? "",
    especificacionesHardware: e?.especificacionesHardware ?? "",
    sistemaOperativo: e?.sistemaOperativo ?? "",
    softwareInstalado: e?.softwareInstalado ?? "",
    estadoTeclado: e?.estadoTeclado ?? "Bueno",
    estadoMouse: e?.estadoMouse ?? "Bueno",
    estadoMonitor: e?.estadoMonitor ?? "Bueno",
    estadoCableEthernet: e?.estadoCableEthernet ?? "Bueno",
    estadoCpu: e?.estadoCpu ?? "Funciona",
    estadoComputadora: e?.estadoComputadora ?? "Funcionando",
    // La contraseña actual no llega en la respuesta: el campo es para una nueva.
    contrasena: "",
    borrarContrasena: false,
    observaciones: e?.observaciones ?? "",
    motivoCambio: "",
  };
}

function EquipoForm({
  equipo,
  salaInicial,
  salas,
  onClose,
  onGuardado,
}: Omit<EquipoFormModalProps, "open">) {
  const queryClient = useQueryClient();
  const puedeDarDeBaja = usePermiso("inventario.darDeBaja");
  const puedeReactivar = usePermiso("inventario.reactivar");
  const verContrasenas = usePermiso("equipos.verContrasenas");
  const [mostrarContrasenas, setMostrarContrasenas] = useState(false);
  /** Contraseñas registradas, si el usuario las cargó (queda en la bitácora). */
  const [cargadas, setCargadas] = useState<ContrasenasEquipo | null>(null);
  const hayRegistradas = Boolean(equipo && (equipo.tieneContrasena || equipo.tieneUltimaContrasena));
  const [iniciales] = useState(() => valoresIniciales(equipo, salaInicial));
  const enBaja = iniciales.estado === "BAJA";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EquipoComputoValues>({ resolver: zodResolver(equipoComputoSchema), defaultValues: iniciales });
  const borrarContrasena = useWatch({ control, name: "borrarContrasena" });

  const mutation = useMutation({
    mutationFn: (v: EquipoComputoValues) => {
      const nulo = (s: string) => (s === "" ? null : s);
      const datos: EquipoComputoRequest = {
        idEquipoComputo: equipo?.idEquipoComputo ?? null,
        inventario: v.inventario,
        nombreArticulo: v.nombreArticulo,
        nombreMarca: v.nombreMarca,
        nombreModelo: v.nombreModelo,
        serie: nulo(v.serie),
        cantidad: 1,
        caracteristicas: nulo(v.caracteristicas),
        estado: v.estado,
        // El backend quita la sala si llega vacía: siempre se envía.
        idSala: Number(v.idSala),
        procesador: nulo(v.procesador),
        ram: nulo(v.ram),
        almacenamiento: nulo(v.almacenamiento),
        especificacionesHardware: nulo(v.especificacionesHardware),
        sistemaOperativo: nulo(v.sistemaOperativo),
        softwareInstalado: nulo(v.softwareInstalado),
        estadoTeclado: v.estadoTeclado,
        estadoMouse: v.estadoMouse,
        estadoMonitor: v.estadoMonitor,
        estadoCableEthernet: v.estadoCableEthernet,
        estadoCpu: v.estadoCpu,
        estadoComputadora: v.estadoComputadora,
        // Solo se envía si cambia (o se pide borrarla); el backend guarda la
        // anterior como "última" y lo registra en la bitácora.
        // Se envía solo si es distinta de la registrada (si se cargó), para
        // que el backend no la mueva a "última contraseña" sin un cambio real.
        contrasena:
          verContrasenas && !v.borrarContrasena && v.contrasena !== "" && v.contrasena !== (cargadas?.contrasena ?? "")
            ? v.contrasena
            : null,
        borrarContrasena: verContrasenas && v.borrarContrasena,
        observaciones: nulo(v.observaciones),
        motivoCambio: nulo(v.motivoCambio),
      };
      return equipo ? equipoComputoService.actualizar(equipo.idEquipoComputo, datos) : equipoComputoService.crear(datos);
    },
    onSuccess: (guardado) => {
      void queryClient.invalidateQueries({ queryKey: clavesAulas.equipos });
      for (const clave of CLAVES_INVENTARIO) void queryClient.invalidateQueries({ queryKey: clave });
      toast.success(equipo ? "Equipo actualizado" : "Equipo registrado");
      onGuardado?.(guardado);
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const tipoContrasena = mostrarContrasenas ? "text" : "password";

  const cargar = useMutation({
    mutationFn: () => equipoComputoService.obtenerContrasenas(equipo!.idEquipoComputo),
    onSuccess: (datos) => {
      setCargadas(datos);
      // Se coloca la actual en el campo sin marcar el formulario como modificado.
      setValue("contrasena", datos.contrasena ?? "", { shouldDirty: false });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-6">
      <Seccion titulo="Datos generales">
        <FormField
          label="Número de inventario"
          required
          error={errors.inventario?.message}
          hint={equipo ? "No se puede cambiar en un equipo registrado." : "Identificador único del equipo."}
        >
          {(a11y) => <Input {...a11y} autoComplete="off" readOnly={equipo !== null} {...register("inventario")} />}
        </FormField>
        <FormField label="Serie" error={errors.serie?.message}>
          {(a11y) => <Input {...a11y} autoComplete="off" {...register("serie")} />}
        </FormField>
        <FormField label="Artículo" required error={errors.nombreArticulo?.message}>
          {(a11y) => <Input {...a11y} {...register("nombreArticulo")} />}
        </FormField>
        <FormField label="Sala" required error={errors.idSala?.message} hint="Cambia la sala para mover el equipo.">
          {(a11y) => (
            <Select {...a11y} {...register("idSala")}>
              {salas.map((s) => (
                <option key={s.idSala} value={String(s.idSala)}>
                  {s.codigoSala}
                  {s.nombre ? ` · ${s.nombre}` : ""}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label="Marca" required error={errors.nombreMarca?.message}>
          {(a11y) => <Input {...a11y} placeholder="Dell" {...register("nombreMarca")} />}
        </FormField>
        <FormField label="Modelo" required error={errors.nombreModelo?.message}>
          {(a11y) => <Input {...a11y} placeholder="OptiPlex 7090" {...register("nombreModelo")} />}
        </FormField>
        <FormField
          label="Estado en inventario"
          error={errors.estado?.message}
          hint={
            enBaja && !puedeReactivar
              ? "Solo el administrador puede reactivar un equipo dado de BAJA."
              : !puedeDarDeBaja
                ? "Solo el administrador puede dar de BAJA un equipo."
                : undefined
          }
        >
          {(a11y) => (
            // Un equipo en BAJA solo lo reactiva el administrador: el Operador
            // ve únicamente esa opción (un select deshabilitado no se enviaría).
            <Select {...a11y} {...register("estado")}>
              {(puedeReactivar || !enBaja) && (
                <>
                  <option value="ALTA">ALTA</option>
                  <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                </>
              )}
              {(puedeDarDeBaja || enBaja) && <option value="BAJA">BAJA</option>}
            </Select>
          )}
        </FormField>
        <FormField label="Características" error={errors.caracteristicas?.message}>
          {(a11y) => <Input {...a11y} {...register("caracteristicas")} />}
        </FormField>
      </Seccion>

      <Seccion titulo="Estado operativo">
        <SelectOpciones label="Estado de la computadora" opciones={OPCIONES.computadora} actual={iniciales.estadoComputadora} registro={register("estadoComputadora")} />
        <SelectOpciones label="CPU" opciones={OPCIONES.cpu} actual={iniciales.estadoCpu} registro={register("estadoCpu")} />
        <SelectOpciones label="Monitor" opciones={OPCIONES.monitor} actual={iniciales.estadoMonitor} registro={register("estadoMonitor")} />
        <SelectOpciones label="Teclado" opciones={OPCIONES.teclado} actual={iniciales.estadoTeclado} registro={register("estadoTeclado")} />
        <SelectOpciones label="Mouse" opciones={OPCIONES.mouse} actual={iniciales.estadoMouse} registro={register("estadoMouse")} />
        <SelectOpciones label="Cable de red" opciones={OPCIONES.ethernet} actual={iniciales.estadoCableEthernet} registro={register("estadoCableEthernet")} />
      </Seccion>

      <Seccion titulo="Hardware y software">
        <FormField label="Procesador" error={errors.procesador?.message}>
          {(a11y) => <Input {...a11y} placeholder="Intel Core i5-11500" {...register("procesador")} />}
        </FormField>
        <FormField label="RAM" error={errors.ram?.message}>
          {(a11y) => <Input {...a11y} placeholder="16 GB" {...register("ram")} />}
        </FormField>
        <FormField label="Almacenamiento" error={errors.almacenamiento?.message}>
          {(a11y) => <Input {...a11y} placeholder="SSD 512 GB" {...register("almacenamiento")} />}
        </FormField>
        <FormField label="Sistema operativo" error={errors.sistemaOperativo?.message}>
          {(a11y) => <Input {...a11y} placeholder="Windows 11 Pro" {...register("sistemaOperativo")} />}
        </FormField>
        <FormField label="Otras especificaciones" error={errors.especificacionesHardware?.message} className="sm:col-span-2">
          {(a11y) => <Textarea {...a11y} rows={2} {...register("especificacionesHardware")} />}
        </FormField>
        <FormField
          label="Software instalado"
          error={errors.softwareInstalado?.message}
          hint="Separa los programas con comas."
          className="sm:col-span-2"
        >
          {(a11y) => <Textarea {...a11y} rows={2} {...register("softwareInstalado")} />}
        </FormField>
      </Seccion>

      {verContrasenas && (
        <Seccion
          titulo="Contraseñas"
          accion={
            <Button
              size="sm"
              variant="ghost"
              icon={
                mostrarContrasenas ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              }
              onClick={() => setMostrarContrasenas((v) => !v)}
            >
              {mostrarContrasenas ? "Ocultar" : "Mostrar"}
            </Button>
          }
        >
          {hayRegistradas && !cargadas && (
            <div className="flex flex-wrap items-center gap-2.5 rounded-xl bg-superficie px-3.5 py-3 sm:col-span-2">
              <span className="text-[13px] text-sobre-variante">
                Este equipo ya tiene contraseñas registradas. Cárgalas para verlas o editarlas aquí.
              </span>
              <Button
                size="sm"
                variant="secondary"
                loading={cargar.isPending}
                icon={<KeyRound className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={() => cargar.mutate()}
              >
                Cargar contraseñas
              </Button>
            </div>
          )}
          <FormField
            label="Contraseña actual"
            error={errors.contrasena?.message}
            hint={
              cargadas
                ? "Si la cambias, la actual pasará a ser la última contraseña."
                : equipo?.tieneContrasena
                  ? "Hay una registrada: déjala vacía para conservarla o escribe una nueva."
                  : undefined
            }
          >
            {(a11y) => (
              <Input
                {...a11y}
                type={tipoContrasena}
                autoComplete="new-password"
                // readOnly y no disabled: un campo deshabilitado no se envía y
                // el esquema esperaría un texto.
                readOnly={borrarContrasena}
                className={borrarContrasena ? "opacity-50" : undefined}
                {...register("contrasena")}
              />
            )}
          </FormField>
          <FormField
            label="Última contraseña"
            hint="La guarda el sistema automáticamente cuando cambias la actual."
          >
            {(a11y) => (
              <Input
                {...a11y}
                type={cargadas?.ultimaContrasena ? tipoContrasena : "text"}
                readOnly
                tabIndex={-1}
                value={
                  cargadas
                    ? (cargadas.ultimaContrasena ?? "Sin registrar")
                    : equipo?.tieneUltimaContrasena
                      ? "Registrada (cárgala para verla)"
                      : "Sin registrar"
                }
                className="bg-superficie text-sobre-variante"
              />
            )}
          </FormField>
          {equipo?.tieneContrasena && (
            <label className="flex items-center gap-2.5 text-sm font-semibold sm:col-span-2">
              <input type="checkbox" className="h-5 w-5 accent-verde" {...register("borrarContrasena")} />
              Quitar la contraseña actual
            </label>
          )}
          <div className="sm:col-span-2">
            <Alert tone="info">
              Se guardan cifradas y cada cambio o consulta queda en la bitácora del equipo.
            </Alert>
          </div>
        </Seccion>
      )}

      <FormField label="Observaciones" error={errors.observaciones?.message}>
        {(a11y) => <Textarea {...a11y} rows={3} {...register("observaciones")} />}
      </FormField>

      {equipo && (
        <FormField
          label="Motivo del cambio"
          error={errors.motivoCambio?.message}
          hint="Opcional. Queda como nota en la bitácora del equipo."
        >
          {(a11y) => <Input {...a11y} {...register("motivoCambio")} />}
        </FormField>
      )}

      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2.5 bg-superficie px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={equipo !== null && !isDirty}
          icon={<Save className="h-4 w-4" aria-hidden="true" />}
        >
          {equipo ? "Guardar cambios" : "Registrar equipo"}
        </Button>
      </div>
    </form>
  );
}

function Seccion({ titulo, accion, children }: { titulo: string; accion?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-variante pb-2">
        <h3 id={id} className="text-xs font-extrabold uppercase tracking-[0.08em] text-dorado-texto">
          {titulo}
        </h3>
        {accion}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** Select de un catálogo; conserva un valor antiguo que ya no esté en la lista. */
function SelectOpciones({
  label,
  opciones,
  actual,
  registro,
}: {
  label: string;
  opciones: readonly string[];
  actual: string;
  registro: UseFormRegisterReturn;
}) {
  const lista = actual && !opciones.includes(actual) ? [actual, ...opciones] : opciones;
  return (
    <FormField label={label}>
      {(a11y) => (
        <Select {...a11y} {...registro}>
          {lista.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      )}
    </FormField>
  );
}
