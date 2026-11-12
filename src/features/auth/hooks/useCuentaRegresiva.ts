"use client";

import { useEffect, useState } from "react";

/**
 * Cuenta regresiva en segundos para "Reenviar código". El backend no manda otro
 * correo del mismo tipo antes de 60 s, así que el botón espera lo mismo.
 */
export function useCuentaRegresiva() {
  const [restante, setRestante] = useState(0);
  useEffect(() => {
    if (restante <= 0) return;
    const t = setTimeout(() => setRestante((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [restante]);
  return { restante, iniciar: (segundos = 60) => setRestante(segundos) };
}
