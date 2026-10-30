import axios from "axios";

/**
 * Cliente HTTP único para hablar con el backend Spring Boot.
 *
 * La URL base es relativa (`/api`): el navegador llama al mismo origen de
 * Next.js y el `rewrite` de next.config.ts reenvía la petición al backend.
 * Por eso no se necesita ninguna variable NEXT_PUBLIC_ ni configuración CORS.
 *
 * Diferencia con el proyecto original: se eliminó el interceptor que leía
 * `localStorage.token`. El login del backend devuelve el usuario, no un token,
 * de modo que esa cabecera nunca se enviaba. Si el backend incorpora JWT en
 * su refactorización, el interceptor se vuelve a añadir aquí.
 */
export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});
