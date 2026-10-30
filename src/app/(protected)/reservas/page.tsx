import type { Metadata } from "next";

import { ReservaSalasPage } from "@/features/reservas/ReservaSalasPage";

export const metadata: Metadata = { title: "Reserva de Salas | Control TIC" };

export default function ReservasPage() {
  return <ReservaSalasPage />;
}
