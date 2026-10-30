import type { Metadata } from "next";

import { UsersAdminPage } from "@/features/admin/users/UsersAdminPage";

export const metadata: Metadata = { title: "Gestión de Usuarios | Control TIC" };

export default function AdminUsuariosPage() {
  return <UsersAdminPage />;
}
