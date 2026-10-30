import type { NextConfig } from "next";

/*
 * URL del backend Spring Boot. Solo se lee en el servidor de Next.js
 * (no lleva prefijo NEXT_PUBLIC_), por lo que nunca llega al navegador.
 * El valor por defecto coincide con server.port=8000 del backend.
 */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  /*
   * Sustituye al proxy de vite.config.js: el navegador llama a /api/... en el
   * mismo origen y Next.js reenvía la petición a Spring Boot. Así el frontend
   * no depende de la configuración CORS del backend y las rutas de los
   * servicios (/api/usuarios, /api/salas, ...) se conservan sin cambios.
   */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
