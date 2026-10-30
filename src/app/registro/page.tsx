import type { Metadata } from "next";

import { RegistroForm } from "@/features/users/RegistroForm";

export const metadata: Metadata = { title: "Registro | Control TIC" };

export default function RegistroPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <RegistroForm />
    </div>
  );
}
