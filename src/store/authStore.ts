import { create } from "zustand";
import { toast } from "react-hot-toast";

import { alExpirarSesion } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { authService } from "@/lib/api/services";
import type { Usuario } from "@/types/api";

type ResultadoLogin = { success: true; user: Usuario } | { success: false; error: ApiError };

interface AuthState {
  user: Usuario | null;
  /**
   * `false` hasta que `GET /api/auth/me` responde. Mientras sea `false` los
   * componentes no deben decidir si hay o no sesión. (Se conserva el nombre
   * de la versión con localStorage para no cambiar a quien lo lee.)
   */
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<ResultadoLogin>;
  /** Consulta la sesión de las cookies; se llama una vez al cargar la app. */
  verificarSesion: () => Promise<void>;
  /** Reemplaza los datos del usuario (por ejemplo, tras editar el perfil). */
  setUser: (user: Usuario | null) => void;
}

/** Clave que usaba la versión anterior para guardar el usuario en localStorage. */
const CLAVE_ANTIGUA = "tic-auth";

/**
 * Sesión del usuario (backend v4).
 *
 * El backend guarda la sesión en cookies httpOnly; aquí solo vive en memoria
 * el usuario que devuelve `/auth/login` o `/auth/me`. Ya no se usa
 * localStorage: el navegador no puede leer el token y nadie puede fingir una
 * sesión editando el almacenamiento.
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  hasHydrated: false,

  login: async (email, password) => {
    try {
      const { usuario } = await authService.login({ email, password });
      set({ user: usuario, hasHydrated: true });
      return { success: true, user: usuario };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error : new ApiError("Error al iniciar sesión", null),
      };
    }
  },

  verificarSesion: async () => {
    try {
      window.localStorage.removeItem(CLAVE_ANTIGUA);
    } catch {
      // Almacenamiento bloqueado: no importa, ya no se usa.
    }
    try {
      const { usuario } = await authService.sesionActual();
      set({ user: usuario, hasHydrated: true });
    } catch {
      set({ user: null, hasHydrated: true });
    }
    // Si el refresh token también vence a mitad del uso, se cierra la sesión
    // y AuthGuard envía a /login?next=... con la ruta actual.
    alExpirarSesion(() => {
      if (get().user) {
        set({ user: null });
        toast.error("Tu sesión expiró. Inicia sesión de nuevo.");
      }
    });
  },

  setUser: (user) => set({ user }),
}));

/** `true` cuando hay un usuario en sesión. */
export const selectIsAuthenticated = (state: AuthState) => state.user !== null;

/**
 * Cierra la sesión en el backend (borra las cookies) y recarga la página de
 * login.
 *
 * Se usa una navegación completa (no `router.push`) porque con Cache Components
 * las páginas visitadas quedan ocultas en memoria con su estado; recargar
 * garantiza que no quede información del usuario anterior.
 */
export async function cerrarSesion() {
  try {
    await authService.logout();
  } catch {
    // Aunque falle (por ejemplo, sesión ya vencida), se limpia el estado local.
  }
  useAuthStore.setState({ user: null });
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa intencional al cerrar sesión (guía "Preserving UI state" de Next.js)
  window.location.assign("/login");
}
