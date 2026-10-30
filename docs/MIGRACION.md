# Plan de migración: TIC-CUUT (React + Vite) a Next.js 16 + TypeScript

- Origen: `TICS-FRONT-END/TIC-UAEMEX-WEB/TIC-CUUT` (solo lectura).
- Destino: `TICS-FRONT-NEXT/tic-cuut`.
- Backend: `JAVA-BACK/TICS-BACKEND` (Spring Boot, puerto 8000, sin modificaciones).

Clasificación: **R** = reutilizable · **A** = requiere adaptación · **C** = requiere reconstrucción · **P** = pendiente de información.

## 1. Arquitectura destino

```
src/
  app/
    layout.tsx                 Raíz (Server): html, fuentes, <Providers>, NavBar, Footer
    not-found.tsx              404
    page.tsx                   /  (rutas públicas directamente en app/: no comparten layout propio)
    login/page.tsx             /login
    registro/page.tsx          /registro
    unauthorized/page.tsx      /unauthorized
    (protected)/
      layout.tsx               Guard de sesión y rol (Client)
      aulas/page.tsx
      inventario/page.tsx
      inventario/conteo/page.tsx
      reservas/page.tsx
      reservas/mis-solicitudes/page.tsx
      solicitudes-tecnicas/page.tsx
      admin/usuarios/page.tsx
      admin/reservas/page.tsx
      admin/config-agenda/page.tsx
      admin/solicitudes-tecnicas/page.tsx
  components/
    layout/NavBar.tsx, Footer.tsx
    providers/Providers.tsx    QueryClientProvider + Toaster
    ui/                        Piezas compartidas (Modal, ConfirmDialog...) si se repiten
  features/<modulo>/           Misma organización que el origen, en .tsx
  lib/
    api/client.ts              Instancia Axios central
    api/errors.ts              Extracción uniforme del mensaje de error de Spring
    api/services/*.ts          Servicios tipados
    auth/roles.ts              Roles y mapa ruta -> roles (fuente única para guard y NavBar)
  store/authStore.ts           Zustand con persistencia segura para SSR
  types/api/*.ts               Contratos tomados de los DTO del backend
```

El grupo `(protected)` no aparece en la URL: solo agrupa las rutas que comparten el guard de sesión.

## 2. Tabla de migración

### Configuración y entrada

| Elemento de origen | Ubicación actual | Tratamiento | Destino en Next.js | Estado |
|---|---|---|---|---|
| index.html | `index.html` | A: metadata del layout | `app/layout.tsx` | Hecho |
| Punto de entrada | `src/main.jsx` | A: QueryClient en un Client Component | `components/providers/Providers.tsx` | Hecho |
| App + BrowserRouter | `src/App.jsx` | A: estructura en el layout raíz; Toaster en Providers | `app/layout.tsx` | Hecho |
| Rutas | `src/routes/AppRoutes.jsx` | C: carpetas de App Router (módulos con marcador temporal) | `app/`, `app/(protected)` | Hecho |
| Proxy `/api` | `vite.config.js` | A: `rewrites` | `next.config.ts` | Hecho |
| Variable `VITE_API_BASE_URL` | `src/api/axios.js` | A: `BACKEND_URL` solo en servidor | `.env.local` | Hecho |
| Lint | `.oxlintrc.json` | Sustituido por ESLint de Next | `eslint.config.mjs` | Hecho |

### Estilos y recursos

| Elemento de origen | Ubicación actual | Tratamiento | Destino en Next.js | Estado |
|---|---|---|---|---|
| Estilos globales | `src/index.css` | C: nueva paleta en `@theme` | `app/globals.css` | Hecho |
| Plantilla Vite | `src/App.css` | Se descarta (no se usa) | — | — |
| Recursos de plantilla | `src/assets/*.svg`, `hero.png` | Se descartan (no se usan) | — | — |
| Favicon | `public/favicon.svg` | R | `app/icon.svg` | Pendiente |
| Emojis como iconos (69 líneas) | Varios componentes | A: lucide-react | En cada componente | Pendiente |
| Colores fijos `#486AE6`, `#A65D8B`, `#7AD349`, `slate-*` | Todos los componentes | A: tokens de la paleta | En cada componente | Pendiente |
| Componentes compartidos (botón, etiqueta de estado, tabla, modal, confirmación, aviso, campos, encabezado, lista vacía) | Repetidos en cada módulo; `window.confirm` y `alert` | C: según el prototipo aprobado | `components/ui/*` + catálogo en `/dev/componentes` (solo desarrollo) | Hecho |
| Colores de estado por módulo | Clases distintas en cada componente | C: un tono por significado | `lib/estados.ts` | Hecho |

### Comunicación con el backend

| Elemento de origen | Ubicación actual | Tratamiento | Destino en Next.js | Estado |
|---|---|---|---|---|
| Cliente Axios | `src/api/axios.js` | A: tipado; se quita el interceptor de token (el backend no emite token) | `lib/api/client.ts` | Hecho |
| Manejo de errores repetido | Todos los servicios | A: función común (`request` + `ApiError`) | `lib/api/errors.ts` | Hecho |
| usuarioService | `src/api/services/usuarioService.js` | A: tipado + `login` (antes en el store) + `registrar` (`POST /usuarios/registro`) | `lib/api/services/usuarioService.ts` | Hecho |
| salaService | `src/api/services/salaService.js` | A: tipado | `lib/api/services/salaService.ts` | Hecho |
| equipoComputoService | `src/api/services/equipoComputoService.js` | A: tipado; se omite el alias sin uso `guardarODetalleTecnico` | `lib/api/services/equipoComputoService.ts` | Hecho |
| inventoryService | `src/api/services/inventoryService.js` | A: tipado; descargas como `Blob` | `lib/api/services/inventoryService.ts` | Hecho |
| reservaSalasService | `src/api/services/reservaSalasService.js` | A: tipado | `lib/api/services/reservaSalasService.ts` | Hecho |
| solicitudTecnicaService | `src/api/services/solicitudTecnicaService.js` | A: tipado + `cerrarSolicitud` (`PUT /{id}/cerrar`) | `lib/api/services/solicitudTecnicaService.ts` | Hecho |
| Contratos de datos | DTO y entidades de `TICS-BACKEND` | C: interfaces TypeScript | `types/api/*.ts` | Hecho |

### Estado y autenticación

| Elemento de origen | Ubicación actual | Tratamiento | Destino en Next.js | Estado |
|---|---|---|---|---|
| authStore | `src/store/authStore.js` | A: `persist` de Zustand con `skipHydration`; clave `tic-auth` | `store/authStore.ts` | Hecho |
| ProtectedRoute | `src/features/auth/ProtectedRoute.jsx` | C: layout protegido + `AuthGuard` | `app/(protected)/layout.tsx`, `features/auth/AuthGuard.tsx` | Hecho |
| Constantes de roles | `AppRoutes.jsx`, `NavBar.jsx` (duplicadas y en desacuerdo) | C: fuente única de rutas y permisos por acción | `lib/auth/roles.ts`, `lib/auth/permisos.ts`, `features/auth/usePermiso.ts` | Hecho |
| computerStore | `src/features/classroom-map/store/computerStore.js` | Se descarta: no se usa y llama a endpoints que no existen | — | — |

### Layout y páginas generales

| Elemento de origen | Ubicación actual | Tratamiento | Destino en Next.js | Estado |
|---|---|---|---|---|
| NavBar | `src/components/layout/NavBar.jsx` | A: Client; `next/link`; iconos lucide; ruta activa con `usePathname`; cierre con Escape | `components/layout/NavBar.tsx` | Hecho |
| Footer | `src/components/layout/Footer.jsx` | R: Server Component | `components/layout/Footer.tsx` | Hecho |
| LandingPage | `src/pages/LandingPage.jsx` | A: Server + `LandingSessionActions` (Client); corrige `user.name` por `user.nombre` | `app/page.tsx` | Hecho |
| NotFoundPage | `src/pages/NotFoundPage.jsx` | A | `app/not-found.tsx` | Hecho |
| UnauthorizedPage | `src/pages/UnauthorizedPage.jsx` | A: Server + `UnauthorizedActions` (Client) | `app/unauthorized/page.tsx` | Hecho |

### Módulos funcionales

| Elemento de origen | Ubicación actual | Tratamiento | Destino en Next.js | Estado |
|---|---|---|---|---|
| LoginPage | `features/auth/LoginPage.jsx` | A: `useRouter`; volver a la ruta de origen con `?next=` | `app/login/page.tsx` + `features/auth/LoginForm.tsx` | Hecho |
| RegistroUsuarioPage | `features/users/pages/RegistroUsuarioPage.jsx` | A: conectado a `POST /usuarios/registro`; sin selector de rol (el backend asigna Profesor) | `app/registro/page.tsx` + `features/users/RegistroForm.tsx` | Hecho |
| Inventario (2 páginas, 7 componentes) | `features/inventory/**` | A: tipado, iconos, paleta | `features/inventory/**` + rutas | Pendiente |
| Mapa de aulas (1 página, 5 componentes, 5 modales) | `features/classroom-map/**` | A: `<canvas>` en Client; framer-motion | `features/classroom-map/**` + `/aulas` | Pendiente |
| Reservas (3 páginas, 2 componentes, 6 modales) | `features/salas/**` | A | `features/salas/**` + rutas | Pendiente |
| Mesa de ayuda (2 páginas, 2 componentes, 3 modales) | `features/solicitudes-tecnicas/**` | A: corregir `cerrarSolicitud` | `features/solicitudes-tecnicas/**` + rutas | Pendiente |
| Gestión de usuarios (1 página, 5 componentes) | `features/admin/users/**` | A: react-hook-form + zod; corrige el rol que se perdía al editar; protege la cuenta propia; reglas de contraseña | `features/admin/users/**` + `/admin/usuarios` | Hecho |
| AdminReservaSalasPage | `features/admin/pages/AdminReservaSalasPage.jsx` | R: envoltorio que pasa `idAdmin` | `app/(protected)/admin/reservas/page.tsx` | Pendiente |
| AdminConfigAgendaPage | `features/admin/pages/AdminConfigAgendaPage.jsx` | A: interruptor local con aviso "Pendiente de backend" | `app/(protected)/admin/config-agenda/page.tsx` + `features/admin/ConfigAgendaPanel.tsx` | Hecho |

## 3. Incompatibilidades Vite a Next.js

1. **Enrutamiento**: React Router (`<Routes>`, `<Navigate>`, `useNavigate`, `useLocation().state`) se reemplaza por carpetas, `next/link`, `useRouter` y `redirect`. El `state` de navegación no existe; la ruta de retorno del login pasa a `?next=`.
2. **Renderizado en servidor**: Next.js prerenderiza también los Client Components. Todo acceso a `localStorage`, `window` o `document` debe ocurrir en efectos o manejadores, nunca al importar o renderizar.
3. **Variables de entorno**: `import.meta.env.VITE_*` pasa a `process.env.NEXT_PUBLIC_*`. Aquí no hace falta ninguna pública porque el navegador usa `/api` en el mismo origen.
4. **Cache Components y `<Activity>`**: al navegar, la página anterior se oculta en lugar de desmontarse. Modales y menús abiertos podrían conservar su estado al volver; hay que revisarlo en cada módulo.
5. **Archivos**: `.jsx` pasa a `.tsx`; alias `@/` en lugar de rutas `../../..`.

## 4. Decisiones tomadas

1. **Configuración de agenda** (2026-10-30): se migra la pantalla con un aviso visible de "Pendiente de backend", porque no existe endpoint para persistir el estado.
2. **Matriz de permisos por acción** (2026-10-30, reemplaza la decisión anterior sobre Operador): definida en `src/lib/auth/permisos.ts`. Las rutas (`roles.ts`), el menú y los botones de cada pantalla consultan la misma tabla.

| Ventana / acción | Admin | Operador-tics | Profesor | Estudiante |
|---|:-:|:-:|:-:|:-:|
| Salas: ver | Sí | Sí | — | — |
| Salas: crear / editar / borrar | Sí | — | — | — |
| Equipos de cómputo: ver / crear / editar / borrar, ver contraseñas | Sí | Sí | — | — |
| Inventario: ver / crear / editar | Sí | Sí | — | — |
| Inventario: borrar, dar de BAJA | Sí | — | — | — |
| Inventario: estado masivo a ALTA / MANTENIMIENTO | Sí | Sí | — | — |
| Conteos y reportes | Sí | Sí | — | — |
| Control de Reservas | Sí | Sí | — | — |
| Apertura / Cierre de Agenda | Sí | — | — | — |
| Gestión de Usuarios | Sí | — | — | — |
| Panel Mesa de Ayuda (atender tickets) | Sí | Sí | — | — |
| Reservar sala y mis solicitudes | Sí (opcional) | — | Sí | — |
| Crear y ver mis tickets | — | — | Sí | Sí |

3. **Página tras el login** (2026-10-30): la sección principal de cada rol (`INICIO_POR_ROL`): Admin a Control de Reservas, Operador a Inventario, Profesor a Reserva de Salas, Estudiante a Mesa de Ayuda. Si `?next=` apunta a una ruta que el rol no tiene permitida, se usa su sección principal.
4. **Menú**: se mantiene el menú lateral de hamburguesa a la izquierda, con solo las opciones permitidas para el rol.
5. **Diseño** (2026-10-30): prototipo visual aprobado (lienzo "Prototipo Control TIC"); sus componentes se implementan en `components/ui` antes de migrar los módulos.
6. **Orden de migración** (2026-10-30): de menor a mayor complejidad, una rama y un PR por módulo: Gestión de Usuarios, Inventario (+ conteos y reportes), Reservas (+ control de reservas), Mesa de Ayuda (alumno + panel), Mapa de Aulas.
7. **Formularios** (2026-10-30): react-hook-form + zod; se instalan con el primer módulo que los usa (Gestión de Usuarios).
8. **Gestión de Usuarios** (2026-10-30): el Admin no puede eliminarse, desactivarse ni cambiar su propio rol; al editar hay un campo opcional "Nueva contraseña" (vacío conserva la actual); las contraseñas nuevas, también en el registro público, deben tener 8 a 64 caracteres, mayúscula, minúscula, número y sin espacios (`lib/validation/password.ts`). El backend no valida estas reglas.
9. **Pruebas automáticas y CI** (2026-10-30): ninguna por ahora; se valida con `pnpm lint`, `pnpm build` y pruebas manuales por rol.

## 5. Riesgos conocidos (sin cambios en el backend)

- La sesión vive en `localStorage` y el backend recibe `idUsuario`/`idAdmin` como parámetro sin verificarlo. La protección de rutas del frontend es solo de experiencia de usuario, no de seguridad. Queda para la refactorización del backend.
- `CORS` del backend usa `allowedOriginPatterns("*")` con `allowCredentials(true)`. No afecta al frontend gracias al rewrite; queda anotado para el backend.
- `GET /equipos-computo` devuelve la entidad JPA con `contrasena`, `passwordAdmin` y `lastPassword` en texto plano a cualquier cliente. La relación `sala` es LAZY y puede llegar nula o fallar al serializarse.
- Las contraseñas de usuario se guardan sin cifrar (`setPasswordHash("Admin123!")` en DataSeeder).
- `PUT /solicitudes-tecnicas/{id}/cerrar` exige el estado RESUELTO, pero `resolver-ticket` pasa directamente a CERRADA: la acción "Confirmar resolución" del alumno nunca puede completarse.
- `SolicitudTecnicaService` compara ids `Integer` con `!=` (compara referencias): para ids mayores a 127 puede negar permisos al dueño de la solicitud.

## 6. Cambios de comportamiento intencionales

- Profesor y Estudiante ya no acceden al Mapa de Aulas (antes podían editar equipos y ver sus contraseñas). Admin deja de tener "Mis tickets"; Operador gana Control de Reservas.
- Gestión de Usuarios: al editar ya no se cambia el rol a Profesor por error (el original leía `idRol`, que el backend no envía); se añade el rol Estudiante a filtros y formulario; eliminar y cambiar de estado usan confirmación y avisos del prototipo.
- Cerrar sesión recarga la página (`window.location`) para que Cache Components no conserve en memoria datos del usuario anterior.
- El registro público ya no muestra selector de rol: el backend lo ignoraba y siempre asigna "Profesor".
- Todos los servicios lanzan `ApiError` con el texto del backend. Antes, los métodos sin `try/catch` mostraban el genérico de Axios ("Request failed with status code 400").
