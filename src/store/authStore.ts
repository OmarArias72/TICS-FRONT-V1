import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import { usuarioService } from "@/lib/api/services";
import type { Usuario } from "@/types/api";

type ResultadoLogin = { success: true; user: Usuario } | { success: false; message: string };

/**
 * Almacenamiento vacío para el servidor. Durante el prerenderizado no existe
 * `window`, y Node 26 incluye un `localStorage` global experimental que emite
 * una advertencia si se toca; con esto el servidor nunca lo usa.
 */
const almacenamientoServidor: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const obtenerAlmacenamiento = (): StateStorage =>
  typeof window === "undefined" ? almacenamientoServidor : window.localStorage;

interface AuthState {
  user: Usuario | null;
  /**
   * `false` hasta que se lee la sesión guardada en el navegador.
   * El servidor nunca tiene acceso a localStorage, así que mientras sea `false`
   * los componentes no deben decidir si hay o no sesión.
   */
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<ResultadoLogin>;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

/**
 * Sesión del usuario, persistida en localStorage.
 *
 * Diferencia con el original: allí el store leía localStorage al importarse,
 * lo que en Next.js se ejecuta también en el servidor y provoca diferencias
 * entre el HTML del servidor y el del navegador. Aquí `skipHydration` retrasa
 * la lectura hasta que `Providers` llama a `rehydrate()` en el navegador.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,

      login: async (email, password) => {
        try {
          const user = await usuarioService.login({ email, password });
          set({ user });
          return { success: true, user };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Error al iniciar sesión";
          return { success: false, message };
        }
      },

      logout: () => set({ user: null }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "tic-auth",
      storage: createJSONStorage(obtenerAlmacenamiento),
      // Solo se guarda el usuario; las funciones y banderas no se persisten.
      partialize: (state) => ({ user: state.user }),
      skipHydration: true,
      // Se marca como leída aunque falle (por ejemplo, localStorage bloqueado):
      // en ese caso se continúa sin sesión en lugar de quedarse cargando.
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true });
      },
    },
  ),
);

/** `true` cuando hay un usuario en sesión. */
export const selectIsAuthenticated = (state: AuthState) => state.user !== null;

/**
 * Cierra la sesión y recarga la página de login.
 *
 * Se usa una navegación completa (no `router.push`) porque con Cache Components
 * las páginas visitadas quedan ocultas en memoria con su estado; recargar
 * garantiza que no quede información del usuario anterior.
 */
export function cerrarSesion() {
  useAuthStore.getState().logout();
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa intencional al cerrar sesión (guía "Preserving UI state" de Next.js)
  window.location.assign("/login");
}
