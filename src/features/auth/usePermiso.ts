"use client";

import { tienePermiso, type Permiso } from "@/lib/auth/permisos";
import { useAuthStore } from "@/store/authStore";

/**
 * Indica si el usuario en sesión tiene un permiso.
 * Uso en una pantalla: `const puedeBorrar = usePermiso("inventario.eliminar");`
 */
export function usePermiso(permiso: Permiso): boolean {
  const rol = useAuthStore((s) => s.user?.nombreRol);
  return tienePermiso(rol, permiso);
}
