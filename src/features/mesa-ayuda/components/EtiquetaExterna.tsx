/** Distingue las solicitudes sin cuenta (el solicitante no ve el seguimiento). */
export function EtiquetaExterna() {
  return (
    <span
      className="rounded-full bg-info-claro px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-info-oscuro"
      title="Abierta por TIC para alguien sin acceso a su correo institucional"
    >
      Externa
    </span>
  );
}
