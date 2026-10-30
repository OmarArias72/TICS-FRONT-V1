import type { Metadata } from "next";

import { ConteoPage } from "@/features/inventory/ConteoPage";

export const metadata: Metadata = { title: "Conteos de inventario | Control TIC" };

export default function InventarioConteoPage() {
  return <ConteoPage />;
}
