import type { Metadata } from "next";

import { PanelMesaAyudaPage } from "@/features/mesa-ayuda/PanelMesaAyudaPage";

export const metadata: Metadata = { title: "Panel Mesa de Ayuda | Control TIC" };

export default function Page() {
  return <PanelMesaAyudaPage />;
}
