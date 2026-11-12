import type { Metadata } from "next";

import { PerfilPage } from "@/features/perfil";

/**
 * Perfil del usuario en sesión (cualquier rol). La página depende de la
 * sesión, que AuthGuard verifica en el navegador; por eso se excluye de la
 * validación de navegación instantánea de Next.js 16.
 */
export const instant = false;

export const metadata: Metadata = { title: "Mi perfil | Control TIC" };

export default function Page() {
  return <PerfilPage />;
}
