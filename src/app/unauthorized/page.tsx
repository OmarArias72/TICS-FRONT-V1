import type { Metadata } from "next";
import { ShieldX } from "lucide-react";

import { cardClass } from "@/components/ui/styles";
import { UnauthorizedActions } from "@/features/auth/UnauthorizedActions";

export const metadata: Metadata = { title: "Acceso denegado | Control TIC" };

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className={`${cardClass} max-w-md text-center`}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-error-claro">
          <ShieldX className="h-8 w-8 text-error" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold text-sobre-superficie">Acceso denegado</h1>
        <UnauthorizedActions />
      </div>
    </div>
  );
}
