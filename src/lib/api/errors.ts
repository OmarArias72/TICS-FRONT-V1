import { isAxiosError } from "axios";

/**
 * Códigos estables que envía el backend en `ApiError.codigo` (AGENTS.md del
 * backend, sección 8). Se listan los que el frontend usa para reaccionar; el
 * tipo acepta cualquier otro texto.
 */
export type CodigoError =
  | "NO_AUTENTICADO"
  | "SESION_EXPIRADA"
  | "CREDENCIALES_INVALIDAS"
  | "CORREO_NO_VERIFICADO"
  | "CORREO_REGISTRADO"
  | "CORREO_NO_INSTITUCIONAL"
  | "CORREO_SIN_CAMBIO"
  | "CORREO_INVALIDO"
  | "CUENTA_INACTIVA"
  | "CUENTA_BLOQUEADA"
  | "ACCESO_DENEGADO"
  | "SOLO_ADMIN_BAJA"
  | "VALIDACION"
  | "NO_ENCONTRADO"
  | "REGLA_NEGOCIO"
  | "EMPALME"
  | "FUERA_DE_PLAZO"
  | "MODULO_DESHABILITADO"
  | "LIMITE_ACTIVAS"
  | "ESPERA_ENTRE_SOLICITUDES"
  | "EN_ATENCION"
  | "TICKET_DUPLICADO"
  | "ULTIMO_ADMIN"
  | "LIMITE_PETICIONES"
  | "IP_BLOQUEADA"
  | "USUARIO_BLOQUEADO"
  | "RECAPTCHA_INVALIDO"
  | "SALA_CON_EQUIPOS"
  | "SALA_CON_RESERVAS"
  | "MISMO_DIA"
  | "CAMBIO_VIGENTE"
  | "SIN_CAMBIO_ACEPTADO"
  | "BUZON_DESHABILITADO"
  | "BUZON_EN_REVISION"
  | "BUZON_ERROR"
  | "PASSWORD_ACTUAL_INCORRECTA"
  | "PASSWORD_INVALIDA"
  | "ELIMINACION_NO_PERMITIDA"
  | "TICKET_DISTINTO"
  | "ESTADO_SIN_TICKET"
  | "CORREO_NO_ASOCIABLE"
  | "CODIGO_INVALIDO"
  | "CODIGO_EXPIRADO"
  | "CODIGO_BLOQUEADO"
  | "TOKEN_INVALIDO"
  | "TOKEN_USADO"
  | "TOKEN_EXPIRADO"
  | "CORREO_INSTITUCIONAL"
  | "ENLACE_INVALIDO"
  | "ENLACE_EXPIRADO"
  | "FORMULARIO_NO_EDITABLE"
  | "ENLACE_NO_REENVIABLE"
  | "ESPERA_REENVIO"
  | "NO_ES_EXTERNA"
  | "PROFESOR_SIN_CUENTA"
  | "RESERVA_TERMINADA"
  | (string & {});

/** Cuerpo de error único del backend v4. */
interface CuerpoError {
  status?: number;
  codigo?: string;
  message?: string;
  detalles?: Record<string, string> | null;
}

/**
 * Error de la API con el código HTTP, el `codigo` del backend y un mensaje
 * listo para mostrar. Los componentes muestran `error.message` y, cuando
 * necesitan reaccionar, comparan `error.codigo` (ver `esCodigo`).
 */
export class ApiError extends Error {
  readonly status: number | null;
  readonly codigo: CodigoError | null;
  /** Mensajes por campo cuando `codigo` es "VALIDACION". */
  readonly detalles: Record<string, string>;
  /** Segundos de espera que indica `Retry-After` en un 429. */
  readonly reintentarEn: number | null;

  constructor(
    message: string,
    status: number | null,
    codigo: CodigoError | null = null,
    detalles: Record<string, string> = {},
    reintentarEn: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
    this.reintentarEn = reintentarEn;
  }
}

/** `true` si el error es un ApiError con alguno de esos códigos. */
export function esCodigo(error: unknown, ...codigos: CodigoError[]): error is ApiError {
  return error instanceof ApiError && error.codigo !== null && codigos.includes(error.codigo);
}

/** Mensajes fijos por código HTTP que sustituyen al texto del backend. */
export type MensajesPorEstado = Partial<Record<number, string>>;

function leerCuerpo(data: unknown): CuerpoError {
  if (data && typeof data === "object") return data as CuerpoError;
  // Algún error fuera de Spring (por ejemplo, el backend apagado) llega como texto.
  if (typeof data === "string" && data.trim() !== "" && !data.trim().startsWith("<")) {
    return { message: data };
  }
  return {};
}

/**
 * Convierte cualquier error de una petición en un `ApiError`.
 *
 * Prioridad del mensaje:
 * 1. El mensaje fijo de `porEstado` para ese código HTTP.
 * 2. `message` del backend (ya viene en español y listo para el usuario).
 * 3. Un texto por situación (sin conexión, demasiadas peticiones) o `porDefecto`.
 */
export function toApiError(error: unknown, porDefecto: string, porEstado: MensajesPorEstado = {}): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    if (!error.response) {
      return new ApiError("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.", null);
    }
    const { status, headers } = error.response;
    const cuerpo = leerCuerpo(error.response.data);
    const retry = Number(headers?.["retry-after"]);
    const reintentarEn = Number.isFinite(retry) && retry > 0 ? retry : null;

    let mensaje = porEstado[status] ?? (cuerpo.message?.trim() || null);
    if (!mensaje && status === 429) {
      mensaje = reintentarEn
        ? `Demasiadas peticiones. Inténtalo de nuevo en ${Math.ceil(reintentarEn / 60)} min.`
        : "Demasiadas peticiones. Espera un momento e inténtalo de nuevo.";
    }
    if (!mensaje && status >= 500) mensaje = "Ocurrió un error en el servidor. Inténtalo más tarde.";

    return new ApiError(mensaje ?? porDefecto, status, cuerpo.codigo ?? null, cuerpo.detalles ?? {}, reintentarEn);
  }

  return new ApiError(porDefecto, null);
}

/**
 * Ejecuta una petición y traduce sus errores con `toApiError`.
 * Evita repetir el mismo bloque try/catch en cada método de los servicios.
 */
export async function request<T>(
  peticion: () => Promise<T>,
  porDefecto: string,
  porEstado?: MensajesPorEstado,
): Promise<T> {
  try {
    return await peticion();
  } catch (error) {
    throw toApiError(error, porDefecto, porEstado);
  }
}
