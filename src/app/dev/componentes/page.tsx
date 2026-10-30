import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer, PageHeader } from "@/components/ui";
import { ComponentShowcase } from "@/features/dev/ComponentShowcase";

export const metadata: Metadata = { title: "Componentes | Control TIC" };

/**
 * Catálogo interno de componentes. Solo existe al ejecutar `pnpm dev`:
 * en el build de producción responde 404.
 */
export default function ComponentesPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Desarrollo"
        title="Componentes base"
        description="Piezas compartidas por todos los módulos, según el prototipo aprobado."
      />
      <ComponentShowcase />
    </PageContainer>
  );
}
