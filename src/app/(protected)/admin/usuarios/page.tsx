import type { Metadata } from "next";

import { UsersAdminPage } from "@/features/admin/users/UsersAdminPage";

/**
 * La página depende de la sesión, que AuthGuard verifica en el navegador
 * (GET /api/auth/me); en el servidor solo se renderiza el indicador de carga.
 * Por eso se excluye de la validación de navegación instantánea de Next.js 16
 * (aviso solo de desarrollo "Could not validate that a segment...").
 */
export const instant = false;

export const metadata: Metadata = { title: "Gestión de Usuarios | Control TIC" };

export default function AdminUsuariosPage() {
  return <UsersAdminPage />;
}
