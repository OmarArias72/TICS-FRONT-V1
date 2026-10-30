"use client";

import { useEffect, useState } from "react";

/**
 * Devuelve `value` solo después de que deja de cambiar durante `delay` ms.
 * Sirve para buscar mientras el usuario escribe sin hacer una petición por
 * cada tecla.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
