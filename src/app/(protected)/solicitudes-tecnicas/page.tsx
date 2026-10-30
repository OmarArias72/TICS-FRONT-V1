import type { Metadata } from "next";

import { MisSolicitudesTecnicasPage } from "@/features/mesa-ayuda/MisSolicitudesTecnicasPage";

export const metadata: Metadata = { title: "Mesa de Ayuda | Control TIC" };

export default function Page() {
  return <MisSolicitudesTecnicasPage />;
}
