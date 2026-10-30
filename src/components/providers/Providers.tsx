"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { useAuthStore } from "@/store/authStore";

/**
 * Proveedores globales del lado del cliente (antes en main.jsx y App.jsx).
 *
 * - QueryClient se crea con useState para que cada sesión del navegador tenga
 *   su propia caché y no se recree en cada render.
 * - La sesión guardada se lee aquí, después del primer render, para que el
 *   HTML del servidor y el del navegador coincidan.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000 * 60 * 5,
          },
        },
      }),
  );

  useEffect(() => {
    void useAuthStore.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      {children}
    </QueryClientProvider>
  );
}
