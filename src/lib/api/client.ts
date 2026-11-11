import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * Cliente HTTP único. El navegador llama a `/api/...` en el mismo origen y
 * Next.js lo reenvía al backend (rewrite de next.config.ts).
 *
 * Sesión (backend v4): el JWT viaja en cookies httpOnly que el navegador
 * envía solo; el frontend no guarda ni lee tokens. Cuando el token de acceso
 * (15 min) vence, cualquier petición responde 401: el interceptor pide una vez
 * `POST /api/auth/refresh` y repite la petición. Si la renovación también
 * falla, avisa con `alExpirarSesion` para que el store cierre la sesión.
 */
export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Rutas donde un 401 es la respuesta esperada y no debe intentarse renovar. */
const SIN_RENOVAR = [
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/auth/registro",
  "/auth/verificar-correo",
  "/auth/reenviar-verificacion",
  "/auth/olvide-password",
  "/auth/restablecer-password",
];

type ConfigReintento = InternalAxiosRequestConfig & { _reintento?: boolean };

/** Una sola renovación a la vez: las peticiones que fallen juntas la comparten. */
let renovacion: Promise<boolean> | null = null;

function renovarSesion(): Promise<boolean> {
  renovacion ??= axios
    .post("/api/auth/refresh", null, { withCredentials: true })
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      renovacion = null;
    });
  return renovacion;
}

let alExpirar: (() => void) | null = null;

/** Registra qué hacer cuando la sesión ya no se puede renovar (lo usa authStore). */
export function alExpirarSesion(callback: () => void) {
  alExpirar = callback;
}

apiClient.interceptors.response.use(
  (respuesta) => respuesta,
  async (error: AxiosError) => {
    const config = error.config as ConfigReintento | undefined;
    const url = config?.url ?? "";
    if (error.response?.status !== 401 || !config || config._reintento || SIN_RENOVAR.some((r) => url.startsWith(r))) {
      throw error;
    }
    config._reintento = true;
    if (await renovarSesion()) {
      return apiClient(config);
    }
    alExpirar?.();
    throw error;
  },
);
