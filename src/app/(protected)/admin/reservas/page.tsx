import type { Metadata } from "next";

import { ControlReservasPage } from "@/features/reservas/ControlReservasPage";

export const metadata: Metadata = { title: "Control de Reservas | Control TIC" };

export default function AdminReservasPage() {
  return <ControlReservasPage />;
}
