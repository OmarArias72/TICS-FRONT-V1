import { isAxiosError } from "axios";

/**
 * Error de la API con el código HTTP y un mensaje listo para mostrar.
 *
 * Los componentes solo leen `error.message` (por ejemplo en `toast.error`),
 * así que basta con que el mensaje sea legible.
 */
export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Mensajes fijos por código HTTP que sustituyen al texto del backend. */
export type MensajesPorEstado = Partial<Record<number, string>>;

/**
 * Obtiene el mensaje que envió Spring Boot.
 *
 * Los controladores responden con `body(e.getMessage())`, es decir, un texto
 * plano. Cuando el error no pasa por esos `try/catch`, Spring devuelve su JSON
 * por defecto `{ status, error, message, path }`; en ese caso se usa `message`.
 */
function mensajeDelBackend(data: unknown): string | null {
  if (typeof data === "string" && data.trim() !== "") {
    return data;
  }
  if (data && typeof data === "object" && "message" in data) {
    const { message } = data as { message: unknown };
    if (typeof message === "string" && message.trim() !== "") {
      return message;
    }
  }
  return null;
}

/**
 * Convierte cualquier error de una petición en un `ApiError`.
 *
 * Prioridad del mensaje:
 * 1. El mensaje fijo de `porEstado` para ese código HTTP (por ejemplo
 *    "Sala no encontrada" para 404), igual que hacían los servicios originales.
 * 2. El texto que devolvió el backend.
 * 3. El mensaje `porDefecto`.
 */
export function toApiError(
  error: unknown,
  porDefecto: string,
  porEstado: MensajesPorEstado = {},
): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const fijo = status !== null ? porEstado[status] : undefined;
    const mensaje = fijo ?? mensajeDelBackend(error.response?.data) ?? porDefecto;
    return new ApiError(mensaje, status);
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
