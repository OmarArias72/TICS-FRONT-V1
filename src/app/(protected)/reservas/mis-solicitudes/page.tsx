import type { Metadata } from "next";

import { MisSolicitudesPage } from "@/features/reservas/MisSolicitudesPage";

export const metadata: Metadata = { title: "Mis solicitudes | Control TIC" };

export default function Page() {
  return <MisSolicitudesPage />;
}
