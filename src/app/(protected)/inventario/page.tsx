import type { Metadata } from "next";

import { InventoryPage } from "@/features/inventory/InventoryPage";

export const metadata: Metadata = { title: "Inventario | Control TIC" };

export default function InventarioPage() {
  return <InventoryPage />;
}
