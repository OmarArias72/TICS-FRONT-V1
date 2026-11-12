import { ConfigAgendaPanel } from "@/features/reservas";

/**
 * La página depende de la sesión, que AuthGuard verifica en el navegador
 * (GET /api/auth/me); en el servidor solo se renderiza el indicador de carga.
 * Por eso se excluye de la validación de navegación instantánea de Next.js 16
 * (aviso solo de desarrollo "Could not validate that a segment...").
 */
export const instant = false;

export default function AdminConfigAgendaPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <ConfigAgendaPanel />
    </div>
  );
}
