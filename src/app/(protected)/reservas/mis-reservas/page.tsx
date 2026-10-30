import type { Metadata } from "next";

import { MisReservasPage } from "@/features/reservas/MisReservasPage";

export const metadata: Metadata = { title: "Mis reservas | Control TIC" };

export default function Page() {
  return <MisReservasPage />;
}
