# Plan de migración: TIC-CUUT (React + Vite) a Next.js 16 + TypeScript

- Origen: `TICS-FRONT-END/TIC-UAEMEX-WEB/TIC-CUUT` (solo lectura).
- Destino: `TICS-FRONT-NEXT/tic-cuut`.
- Backend: `JAVA-BACK/TICS-BACKEND` (Spring Boot, puerto 8080; v4.1 con Spring Security, fase 2 y módulo de logs).

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
      reservas/mis-reservas/page.tsx
      solicitudes-tecnicas/page.tsx
      admin/usuarios/page.tsx
      admin/reservas/page.tsx
      admin/config-agenda/page.tsx
      admin/solicitudes-tecnicas/page.tsx
      admin/bitacora/page.tsx  Módulo de logs (bitácora de equipos y auditoría)
  components/
    layout/NavBar.tsx, Footer.tsx
    providers/Providers.tsx    QueryClientProvider + Toaster
    ui/                        Piezas compartidas (Modal, ConfirmDialog...) si se repiten
  features/<modulo>/           pages/, components/, modals/, hooks/, utils/ e index.ts (ver decisión 23)
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
| Emojis como iconos (69 líneas) | Varios componentes | A: lucide-react | En cada componente | Hecho |
| Colores fijos `#486AE6`, `#A65D8B`, `#7AD349`, `slate-*` | Todos los componentes | A: tokens de la paleta | En cada componente | Hecho |
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
| ProtectedRoute | `src/features/auth/ProtectedRoute.jsx` | C: layout protegido + `AuthGuard` | `app/(protected)/layout.tsx`, `features/auth/components/AuthGuard.tsx` | Hecho |
| Constantes de roles | `AppRoutes.jsx`, `NavBar.jsx` (duplicadas y en desacuerdo) | C: fuente única de rutas y permisos por acción | `lib/auth/roles.ts`, `lib/auth/permisos.ts`, `features/auth/hooks/usePermiso.ts` | Hecho |
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
| LoginPage | `features/auth/LoginPage.jsx` | A: `useRouter`; volver a la ruta de origen con `?next=` | `app/login/page.tsx` + `features/auth/components/LoginForm.tsx` | Hecho |
| RegistroUsuarioPage | `features/users/pages/RegistroUsuarioPage.jsx` | A: conectado a `POST /usuarios/registro`; sin selector de rol (el backend asigna Profesor) | `app/registro/page.tsx` + `features/auth/components/RegistroForm.tsx` | Hecho |
| Inventario (2 páginas, 7 componentes) | `features/inventory/**` | A: pestañas Equipos/Conteos, búsqueda con espera, reporte en modal, permisos por acción; corrige marca/modelo | `features/inventario/**` + `/inventario`, `/inventario/conteo` | Hecho |
| Mapa de aulas (1 página, 5 componentes, 5 modales) | `features/classroom-map/**` | A: salas con barra de estado; cuadrícula de PC por estado con panel lateral; formulario con react-hook-form + zod; resumen simplificado; sala abierta en la URL. Se descartan `ClassroomCanvasMap`, `RoomInfoModal` y `RoomSummaryModal`, que no se usaban | `features/aulas/**` + `/aulas` | Hecho |
| Reservas (3 páginas, 2 componentes, 6 modales) | `features/salas/**` | A: reglas de reserva en `reglas.ts`, reserva directa o solicitud en un solo modal, control de reservas con aprobar / rechazar / reasignar / cancelar | `features/reservas/**` + `/reservas`, `/reservas/mis-solicitudes`, `/admin/reservas` | Hecho |
| Mesa de ayuda (2 páginas, 2 componentes, 3 modales) | `features/solicitudes-tecnicas/**` | A: tarjetas con progreso por pasos (prototipo); panel con bandejas, lista y detalle lateral; validaciones del formulario iguales al backend; cierre automático al resolver | `features/mesa-ayuda/**` + `/solicitudes-tecnicas`, `/admin/solicitudes-tecnicas` | Hecho |
| Gestión de usuarios (1 página, 5 componentes) | `features/admin/users/**` | A: react-hook-form + zod; corrige el rol que se perdía al editar; protege la cuenta propia; reglas de contraseña | `features/usuarios/**` + `/admin/usuarios` | Hecho |
| AdminReservaSalasPage | `features/admin/pages/AdminReservaSalasPage.jsx` | R: el `idAdmin` sale de la sesión dentro de `ControlReservasPage` | `app/(protected)/admin/reservas/page.tsx` | Hecho |
| Bitácora (nuevo, sin equivalente en el original) | — | C: bitácora de equipos (Admin y Operador) y auditoría del sistema (Admin), con filtros, paginación y CSV | `features/bitacora/**` + `/admin/bitacora` | Hecho |
| AdminConfigAgendaPage | `features/admin/pages/AdminConfigAgendaPage.jsx` | A: interruptor local con aviso "Pendiente de backend" | `app/(protected)/admin/config-agenda/page.tsx` + `features/reservas/components/ConfigAgendaPanel.tsx` | Hecho |

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
9. **Inventario** (2026-10-30): búsqueda en el backend mientras se escribe (300 ms, conserva el selector de tipo); reporte PDF/CSV en un modal con fechas, artículo y formato; Conteos como pestaña con su propia URL; el Operador puede corregir datos de un equipo en BAJA pero no cambiar su estado, ni seleccionarlo para el cambio masivo.
10. **Reservas** (2026-10-30): horario y duración libres (solo fin posterior al inicio); reserva directa desde hoy hasta 30 días (`MAX_DIAS_ANTICIPACION`), nunca en el pasado; si el horario se empalma o supera los 30 días, el mismo modal ofrece una solicitud extraordinaria con justificación obligatoria. Si el backend rechaza una reserva directa, el modal pasa a modo solicitud con su mensaje. En Control de Reservas, rechazar y cancelar exigen motivo; aprobar y reasignar avisan de empalmes antes de enviar; una fecha pasada se muestra solo como consulta.
11. **Cambios de reserva por la administración y notificaciones** (2026-10-30): el admin puede pedir al profesor, con un mensaje, que cambie su reserva de sala o fecha. Si el profesor acepta, él mismo la modifica desde "Mis reservas"; si no puede, responde con un motivo. El admin conserva la opción de reasignar directamente. El profesor puede cancelar su reserva y modificarla (con un cambio aceptado) solo hasta el día anterior; el mismo día, cualquier cambio lo hace TICS. Las reasignaciones, cancelaciones, aprobaciones, rechazos y solicitudes de cambio generan notificaciones que se ven en una campana en la barra superior. Todo esto depende de endpoints nuevos (sección 7); mientras no existan, las banderas de `lib/api/funcionesBackend.ts` están en `false` y las pantallas muestran "Pendiente de backend".
12. **Mesa de Ayuda** (2026-10-30): al resolver el ticket la solicitud queda cerrada sin confirmación del solicitante (se quita "Confirmar resolución", que nunca funcionaba); el enlace a ServiceDesk apunta a la página general `https://msdtic.uaemex.mx/`; el panel de Admin y Operador es una lista con detalle lateral y bandejas Por revisar / Listas para ticket / Ticket en TICS / Todas, calculadas a partir de una sola consulta; la CURP se muestra oculta hasta pedirla; el solicitante recibirá avisos en la campana cuando su solicitud se apruebe, se rechace o se resuelva (pendiente de backend, sección 7.6).
13. **Mapa de Aulas** (2026-10-30): los equipos se cargan con `GET /equipos-computo` y se agrupan por sala en el navegador, como en el original; dentro de una sala, cuadrícula de PC coloreadas por estado con filtros y panel lateral de detalle; las contraseñas aparecen ocultas, con botones para mostrar y copiar cada una (solo Admin y Operador); el resumen de sala muestra estados, sistemas operativos y periféricos con falla, sin el conteo de software por palabras clave. El formulario permite mover un equipo a otra sala y, igual que en Inventario, el Operador no puede dar de BAJA.
14. **Pruebas automáticas y CI** (2026-10-30): ninguna por ahora; se valida con `pnpm lint`, `pnpm build` y pruebas manuales por rol.
15. **Módulo de logs / Bitácora** (2026-11-02): pantalla `/admin/bitacora` para dar trazabilidad a los cambios. Pestaña **Equipos** (Admin y Operador, permiso `bitacora.equipos`): quién registró, modificó (campo por campo, antes → después), cambió de estado, consultó contraseñas o eliminó cada equipo, desde qué módulo (Inventario, Mapa de Aulas, Mantenimientos, app móvil), cuándo y desde qué IP; atajos "¿Quién registró?", "Modificaciones" y "Eliminaciones"; filtros por equipo, usuario, acción, módulo, texto y fechas; exportar CSV. Pestaña **Sistema** (solo Admin, `bitacora.sistema`): la auditoría general. Inventario muestra "por <usuario>" bajo la fecha de registro y un botón **Historial** por equipo; el detalle de una PC en el Mapa de Aulas muestra quién la registró y "Ver historial". Ambos abren `/admin/bitacora?inventario=...`.

## 5. Riesgos conocidos del backend

> **Actualización 2026-11-02 (backend v4.1).** El backend corrigió la mayoría de estos puntos: sesión con JWT en cookies httpOnly y sin `idUsuario`/`idAdmin` en las peticiones, contraseñas con BCrypt, CURP con AES-256-GCM y clave en variable de entorno, contraseñas de equipos cifradas y pedidas aparte, CORS restringido, mappers completos, endpoint "mis reservas" y eliminación de `PUT /{id}/cerrar`. La lista se conserva como historial; los pendientes actuales están en la sección 11 del `AGENTS.md` del backend.

- La sesión vive en `localStorage` y el backend recibe `idUsuario`/`idAdmin` como parámetro sin verificarlo. La protección de rutas del frontend es solo de experiencia de usuario, no de seguridad. Queda para la refactorización del backend.
- `CORS` del backend usa `allowedOriginPatterns("*")` con `allowCredentials(true)`. No afecta al frontend gracias al rewrite; queda anotado para el backend.
- `GET /equipos-computo` devuelve la entidad JPA con `contrasena`, `passwordAdmin` y `lastPassword` en texto plano a cualquier cliente. La relación `sala` era LAZY y, con `open-in-view=false`, el GET respondía 500 en cuanto un equipo tenía sala; **corregido en el backend** (2026-10-30, con autorización): `EquipoComputo.sala` pasa a `FetchType.EAGER`.
- Las contraseñas de usuario se guardan sin cifrar (`setPasswordHash("Admin123!")` en DataSeeder).
- `PUT /solicitudes-tecnicas/{id}/cerrar` exige el estado RESUELTO, pero `resolver-ticket` pasa directamente a CERRADA, así que nunca puede completarse. Por la decisión 12 el frontend ya no lo usa; el endpoint y el estado RESUELTO pueden eliminarse en la refactorización.
- La CURP se cifra con AES usando una clave escrita en el código (`CryptoUtil`) y `GET /admin/panel` la devuelve descifrada a cualquier cliente, sin verificar el rol. La clave debe ir en configuración externa (no en el repositorio) y el panel debe exigir un usuario de TICS autenticado. Si el descifrado falla, el backend responde el texto "Error al desencriptar" en lugar de la CURP; el formulario la pide de nuevo en ese caso.
- El DTO de solicitudes técnicas no indica quién la tomó (`operadorAtendiendo`) ni hasta cuándo: el panel no puede mostrar que otra persona la está atendiendo hasta que el backend responda el error al intentar tomarla.
- Los métodos `mapTo...DTO` de `ReservaSalasService` no llenan varios campos que declaran los DTO (en `UsoSala`: `fecha`, `idUsuario`, `motivoCancelacion`, `adminModifico`...; en `SolicitudReserva`: `motivoRechazo`, `adminAtendio`, `fechaSolicitud`...). Por eso el profesor no ve el motivo de un rechazo y la reasignación toma la fecha de la agenda consultada.
- No existe un endpoint "mis reservas": el profesor solo ve sus reservas directas en la agenda de cada sala, y no puede cancelarlas él mismo (cancelar es solo `admin/cancelar`).
- El backend solo valida fin posterior al inicio y el empalme; la anticipación máxima y las fechas pasadas se validan únicamente en el frontend.
- `EquipoComputoService.guardar` quita la sala del equipo si `idSala` llega vacío; el formulario siempre la envía. `DELETE /equipos-computo/{id}` borra también el equipo base del inventario (el diálogo de confirmación lo advierte). `DELETE /salas/{id}` no comprueba si la sala tiene equipos o reservas y fallaría por llave foránea; por eso no se ofrece eliminar salas.
- `SolicitudTecnicaService` compara ids `Integer` con `!=` (compara referencias): para ids mayores a 127 puede negar permisos al dueño de la solicitud.

## 6. Cambios de comportamiento intencionales

- Profesor y Estudiante ya no acceden al Mapa de Aulas (antes podían editar equipos y ver sus contraseñas). Admin deja de tener "Mis tickets"; Operador gana Control de Reservas.
- Inventario: el original enviaba `marca` y `modelo`, que el backend ignora (espera `nombreMarca` y `nombreModelo`), por lo que todo equipo creado o editado desde la web quedaba como GENÉRICA / GENÉRICO; corregido. Dar de BAJA en lote pide confirmación; la selección masiva solo afecta a los equipos visibles.
- Gestión de Usuarios: al editar ya no se cambia el rol a Profesor por error (el original leía `idRol`, que el backend no envía); se añade el rol Estudiante a filtros y formulario; eliminar y cambiar de estado usan confirmación y avisos del prototipo.
- Reservas: "hoy" se calcula con la fecha local; el original usaba `toISOString()` (UTC) y, en México después de las 18:00, tomaba el día siguiente. La reserva directa y la solicitud extraordinaria comparten un solo modal que decide el modo según la agenda.
- Mesa de Ayuda: el botón de ServiceDesk ya no abre una orden fija (`woID=46873`) para todas las solicitudes; "Reenviar" ya no manda `idTipo = 1` (el backend lo ignoraba); se añade la bandeja "Ticket en TICS", que en el original solo se veía en "Todas"; "Nueva solicitud" se deshabilita al llegar a 3 solicitudes activas; la CURP aparece oculta en el panel y hay un botón para copiar los datos al ticket de ServiceDesk.
- Mapa de Aulas: la sala abierta queda en la URL (`/aulas?sala=3`) y sobrevive a recargar la página; se envía `ultimoUsuarioActualizacion` con el usuario en sesión (el original mandaba `null`); un equipo se puede mover a otra sala desde su formulario; eliminar pide confirmación propia en lugar de `window.confirm`; guardar o eliminar una PC actualiza también Inventario.
- Cerrar sesión recarga la página (`window.location`) para que Cache Components no conserve en memoria datos del usuario anterior.
- El registro público ya no muestra selector de rol: el backend lo ignoraba y siempre asigna "Profesor".
- Todos los servicios lanzan `ApiError` con el texto del backend. Antes, los métodos sin `try/catch` mostraban el genérico de Axios ("Request failed with status code 400").

## 7. Cambios requeridos en el backend (implementados en v4.1)

> **Actualización 2026-11-02.** El backend v4.1 implementó esta especificación con algunas diferencias: `GET /mis-reservas` devuelve `UsoSala[]` con `solicitudCambio` y `editablePorProfesor` (no un DTO aparte), las notificaciones añaden `GET /conteo` y `DELETE /{id}`, y hay tipos de notificación nuevos. El contrato vigente es `CAMBIOS-FRONTEND-FASE2.md` del backend; los tipos del frontend (`src/types/api`) ya lo siguen.

Esta sección describe lo que `TICS-BACKEND` necesita para las funciones de la decisión 11. **No se ha modificado el backend**; queda para su refactorización. Cuando cada parte exista, se activa su bandera en `src/lib/api/funcionesBackend.ts`.

| Bandera | Parte del backend | Pantallas que la usan |
| --- | --- | --- |
| `misReservas` | 7.3 (mis reservas, cancelar, modificar) | `/reservas/mis-reservas` |
| `solicitudesCambio` | 7.1 + 7.3 (solicitudes de cambio) | Control de Reservas ("Pedir cambio"), Mis reservas |
| `notificaciones` | 7.2 + 7.4 (notificaciones) | Campana en la barra superior |

### 7.1 Base de datos (PostgreSQL, `db/init/01-schema.sql`)

Hoy `spring.jpa.hibernate.ddl-auto=update` crearía las tablas a partir de las entidades, pero conviene agregarlas también al script de inicio para conservar los `CHECK` y los índices.

```sql
-- Solicitud del admin para que el profesor cambie su reserva.
CREATE TABLE IF NOT EXISTS public.solicitudes_cambio_reserva (
  id_solicitud_cambio integer GENERATED BY DEFAULT AS IDENTITY,
  id_uso integer NOT NULL,
  id_admin integer NOT NULL,
  mensaje text NOT NULL,
  estado character varying(20) NOT NULL DEFAULT 'Pendiente',
  respuesta text,
  fecha_creacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta timestamp without time zone,
  CONSTRAINT solicitudes_cambio_reserva_pkey PRIMARY KEY (id_solicitud_cambio),
  CONSTRAINT chk_solicitud_cambio_estado
    CHECK (estado IN ('Pendiente', 'Aceptada', 'Rechazada', 'Aplicada', 'Expirada')),
  CONSTRAINT solicitudes_cambio_id_uso_fkey FOREIGN KEY (id_uso) REFERENCES public.uso_salas(id_uso),
  CONSTRAINT solicitudes_cambio_id_admin_fkey FOREIGN KEY (id_admin) REFERENCES public.usuarios(id_usuario)
);

-- Solo una solicitud de cambio vigente (Pendiente o Aceptada) por reserva.
CREATE UNIQUE INDEX IF NOT EXISTS ux_solicitud_cambio_vigente
  ON public.solicitudes_cambio_reserva (id_uso)
  WHERE estado IN ('Pendiente', 'Aceptada');

-- Notificaciones dentro del sistema.
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id_notificacion integer GENERATED BY DEFAULT AS IDENTITY,
  id_usuario integer NOT NULL,
  tipo character varying(30) NOT NULL,
  titulo character varying(120) NOT NULL,
  mensaje text NOT NULL,
  enlace character varying(255),
  leida boolean NOT NULL DEFAULT false,
  fecha_creacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notificaciones_pkey PRIMARY KEY (id_notificacion),
  CONSTRAINT chk_notificacion_tipo CHECK (tipo IN (
    'RESERVA_REASIGNADA', 'RESERVA_CANCELADA', 'SOLICITUD_APROBADA', 'SOLICITUD_RECHAZADA',
    'CAMBIO_SOLICITADO', 'CAMBIO_RESPONDIDO', 'RESERVA_MODIFICADA',
    'SOLICITUD_TECNICA_APROBADA', 'SOLICITUD_TECNICA_RECHAZADA', 'SOLICITUD_TECNICA_RESUELTA'
  )),
  CONSTRAINT notificaciones_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario)
);

CREATE INDEX IF NOT EXISTS ix_notificaciones_usuario
  ON public.notificaciones (id_usuario, leida, fecha_creacion DESC);
```

`uso_salas` no necesita columnas nuevas: ya tiene `motivo_cancelacion` y `admin_modifico`. Cuando el profesor cancela su propia reserva, `admin_modifico` queda en `NULL`.

### 7.2 Entidades y repositorios (paquetes `salas` y uno nuevo, `notificaciones`)

- `SolicitudCambioReserva` (`@Table(name = "solicitudes_cambio_reserva")`): `@ManyToOne UsoSala uso`, `@ManyToOne Usuario admin`, `mensaje`, `estado`, `respuesta`, `fechaCreacion`, `fechaRespuesta`.
- `SolicitudCambioReservaRepository`: `findFirstByUsoIdUsoAndEstadoIn(Integer idUso, List<String> estados)`.
- `Notificacion` (`@Table(name = "notificaciones")`) y `NotificacionRepository`: `findByUsuarioIdUsuarioOrderByFechaCreacionDesc(Integer idUsuario, Pageable p)`, y una consulta `@Modifying` para marcar todas como leídas.
- `UsoSalaRepository`: `findByUsuarioIdUsuarioAndFechaInicioGreaterThanEqualOrderByFechaInicio(Integer idUsuario, LocalDateTime desde)`.
- `NotificacionService.crear(Usuario destino, String tipo, String titulo, String mensaje, String enlace)`, usado por `ReservaSalasService`.

### 7.3 Endpoints de reservas (`/api/reservas-salas`)

| Método y ruta | Cuerpo / parámetros | Respuesta | Reglas |
| --- | --- | --- | --- |
| `GET /mis-reservas?idUsuario=` | — | `MiReservaResponseDTO[]` | Reservas del usuario desde hoy (incluye canceladas recientes). Cada una con `fecha` y su `solicitudCambio` vigente o `null`. |
| `PUT /mis-reservas/{idUso}/cancelar` | `{ idUsuario, motivoCancelacion }` | `UsoSalaResponseDTO` | Solo el dueño; estado distinto de `Cancelada`; **fecha de la reserva posterior a hoy**. Marca `Expirada` la solicitud de cambio vigente. Notifica al admin que la pidió, si hay. |
| `PUT /mis-reservas/{idUso}/modificar` | `{ idUsuario, idSolicitudCambio, idSalaDestino, fecha, horaInicio, horaFin }` | `UsoSalaResponseDTO` | Solo el dueño; la solicitud debe ser de esa reserva y estar `Aceptada`; fecha original posterior a hoy; nueva fecha no pasada y a 30 días o menos; fin > inicio; sin empalme (excluyendo la propia reserva). Marca la solicitud como `Aplicada`. Notifica al admin (`RESERVA_MODIFICADA`). |
| `POST /admin/solicitar-cambio` | `{ idUso, idAdmin, mensaje }` | `SolicitudCambioResponseDTO` | `idAdmin` con rol Admin u Operador-tics; reserva activa con fecha posterior a hoy; sin otra solicitud vigente. Notifica al profesor (`CAMBIO_SOLICITADO`, enlace `/reservas/mis-reservas`). |
| `PUT /solicitudes-cambio/{id}/responder` | `{ idUsuario, acepta, respuesta? }` | `SolicitudCambioResponseDTO` | Solo el dueño de la reserva; estado `Pendiente`; fecha de la reserva posterior a hoy. `acepta=false` exige `respuesta`. Notifica al admin (`CAMBIO_RESPONDIDO`, enlace `/admin/reservas`). |

Formato de las respuestas nuevas (coinciden con `src/types/api/reserva.ts`):

```json
// SolicitudCambioResponseDTO
{ "idSolicitudCambio": 1, "idUso": 10, "admin": "Ana López", "mensaje": "...",
  "estado": "Pendiente", "respuesta": null,
  "fechaCreacion": "2026-10-30T10:00:00", "fechaRespuesta": null }

// MiReservaResponseDTO = UsoSalaResponseDTO + fecha + solicitudCambio
{ "idUso": 10, "idSala": 2, "codigoSala": "CC-02", "nombreSala": "Laboratorio de Redes",
  "profesor": "Roberto Gómez", "fecha": "2026-11-04", "horaInicio": "09:00", "horaFin": "11:00",
  "proposito": "Clase", "estado": "Confirmada", "fechaRegistro": "2026-10-29T12:00:00",
  "solicitudCambio": null }
```

Cambios a endpoints existentes:

- `PUT /admin/reasignar` y `PUT /admin/cancelar`: crear la notificación al profesor (`RESERVA_REASIGNADA` con sala, fecha y horario nuevos; `RESERVA_CANCELADA` con el motivo) y marcar `Expirada` la solicitud de cambio vigente.
- `POST /admin/aprobar-solicitud` y `POST /admin/rechazar-solicitud`: notificar al solicitante (`SOLICITUD_APROBADA`, `SOLICITUD_RECHAZADA` con el motivo).
- `mapToUsoSalaDTO` y `mapToSolicitudDTO`: llenar los campos que hoy faltan (sección 5), en especial `fecha`, `motivoCancelacion` y `motivoRechazo`.

### 7.4 Endpoints de notificaciones (`/api/notificaciones`)

| Método y ruta | Parámetros | Respuesta |
| --- | --- | --- |
| `GET /notificaciones?idUsuario=` | Últimas 30, más recientes primero | `NotificacionResponseDTO[]` (`idNotificacion, idUsuario, tipo, titulo, mensaje, enlace, leida, fechaCreacion`) |
| `PUT /notificaciones/{id}/leida?idUsuario=` | Solo el dueño | `204` |
| `PUT /notificaciones/leidas?idUsuario=` | Marca todas | `204` |

El frontend consulta cada 60 segundos. Para avisos instantáneos, más adelante puede usarse WebSocket o Server-Sent Events.

### 7.5 Reglas comunes

- "Hoy" debe calcularse en la zona del campus: `LocalDate.now(ZoneId.of("America/Mexico_City"))`, no en la del servidor.
- El límite del profesor se valida en el servidor: `uso.getFechaInicio().toLocalDate().isAfter(hoy)`. El frontend aplica la misma regla en `profesorPuedeCambiar` (`features/reservas/utils/reglas.ts`), pero no es suficiente por sí sola.
- Las comparaciones de ids deben usar `Objects.equals` (ver el riesgo de `Integer !=` en la sección 5).
- Igual que el resto del backend, estos endpoints reciben `idUsuario`/`idAdmin` sin verificarlos. Con autenticación real (JWT o sesión), esos ids deben salir del usuario autenticado y no del cuerpo de la petición.

### 7.6 Notificaciones de la Mesa de Ayuda

Sin endpoints nuevos: `SolicitudTecnicaService` llama a `NotificacionService.crear` para avisar al solicitante, con enlace `/solicitudes-tecnicas`:

| Método del servicio | Tipo | Mensaje sugerido |
| --- | --- | --- |
| `revisarSolicitud` (aprobar) | `SOLICITUD_TECNICA_APROBADA` | "TICS aprobó tu solicitud #N. Completa tus datos para generar el ticket." |
| `revisarSolicitud` (rechazar) | `SOLICITUD_TECNICA_RECHAZADA` | "TICS rechazó tu solicitud #N: <motivo>." |
| `resolverTicket` | `SOLICITUD_TECNICA_RESUELTA` | "Tu solicitud #N quedó resuelta. ID de resolución: <código>." |

Los tres tipos ya están en el `CHECK` de la tabla `notificaciones` (7.1) y en `src/types/api/notificacion.ts`.

## 8. Adaptación al backend v4 (2026-11-02)

El backend pasó a Spring Security con JWT en cookies (fase 1) y añadió notificaciones, solicitudes de cambio y lectura del buzón (fase 2). El frontend se adapta en cuatro PR (decisión del 2026-11-02):

| PR | Contenido | Estado |
| --- | --- | --- |
| 1 | Sesión por cookies, errores con `codigo`, quitar `idUsuario`/`idAdmin`, contratos nuevos (equipos planos, CURP enmascarada, reservas completas, configuración del módulo, reportes XLSX), desbloquear usuario | Hecho |
| 2 | Verificar correo (código de 6 dígitos o enlace), reenviar verificación, olvidé / restablecer contraseña | Hecho |
| 2c | reCAPTCHA v3 en registro, recuperación y solicitudes (opcional; el backend lo trae apagado) | Pendiente |
| 2b | **Mi perfil** (`/perfil`): datos, cambiar contraseña y eliminar cuenta (Profesor y Alumno) | Hecho |
| 3c | Integración con los correos de ServiceDesk: asociación y cierre automáticos, Asociar / Descartar en Buzón, título sugerido `SOL-<id>` | Hecho |
| 3 | Fase 2: campana, mis reservas, solicitudes de cambio, pestaña Buzón | Hecho |
| 3b | Módulo de logs: Bitácora de equipos y auditoría (decisión 15) | Hecho |
| 4 | Mantenimientos y bloqueos temporales (la bitácora y la auditoría pasaron al PR 3b) | Pendiente |

### Sesión

- `store/authStore.ts` ya no usa `localStorage` (se borra la clave antigua `tic-auth`). Al cargar, `Providers` llama a `GET /api/auth/me`; mientras responde, `AuthGuard` muestra "Verificando sesión...".
- `lib/api/client.ts`: ante un 401, una sola llamada a `POST /api/auth/refresh` compartida por las peticiones que fallen juntas, y se repite la petición. Si el refresh falla, el store limpia el usuario, avisa "Tu sesión expiró" y `AuthGuard` envía a `/login?next=...`.
- Cerrar sesión llama a `POST /api/auth/logout` (borra las cookies) antes de recargar `/login`.

### Errores

- `ApiError` incluye `codigo`, `detalles` (por campo, con `VALIDACION`) y `reintentarEn` (cabecera `Retry-After` en 429). `esCodigo(error, "MISMO_DIA", ...)` permite reaccionar a un código.
- Los mensajes del backend se muestran tal cual; los reintentos automáticos de React Query solo aplican a errores de red o 5xx.

### Cambios por módulo

- **Usuarios**: el rol se lee de `idRol`; columnas de correo verificado y último acceso; botón para quitar el bloqueo por intentos fallidos. El backend impide quitar al último Admin (`ULTIMO_ADMIN`).
- **Registro**: `POST /api/auth/registro`; el rol lo decide el dominio (`@alumno.uaemex.mx` Estudiante, `@uaemex.mx` Profesor) y la cuenta queda pendiente de verificar el correo.
- **Inventario**: reporte Excel (`/reportes/equipos/xlsx`); el error de una descarga se lee aunque llegue como Blob.
- **Mapa de Aulas**: `EquipoComputoResponse` plano; las contraseñas se piden con `GET /{id}/contrasenas` al pulsar "Mostrar contraseñas" (queda en la bitácora). El formulario envía `contrasena` solo si cambia, `borrarContrasena` y `motivoCambio`; ya no existen la contraseña de administrador ni la anterior editable.
- **Reservas**: DTO completos (motivo de rechazo y quién atendió en Mis solicitudes); el estado `Reasignada` ocupa el horario; el Admin no tiene el límite de 30 días. Con el módulo cerrado (`GET /configuracion/modulos/RESERVAS`), el Profesor ve el mensaje y no puede consultar la agenda ni reservar.
- **Apertura / Cierre de agenda**: ya se guarda en el backend, con periodo opcional y mensaje para los profesores (se quita el aviso "Pendiente de backend").
- **Mesa de Ayuda**: CURP enmascarada y botón "Mostrar" que pide la completa (auditado); quién la atiende y hasta cuándo; "Liberar"; "Agregar seguimiento"; comentario al resolver; "Procesar correo"; seguimiento del ticket visible para el solicitante. El formulario exige correo alterno distinto, teléfono y descripción, y la CURP se escribe completa en cada guardado. Espera de 8 h entre solicitudes del mismo tipo.

### Fase 2 (PR 3)

- Banderas de `lib/api/funcionesBackend.ts` en `true`.
- **Campana**: cada 60 s (y al volver a la pestaña) consulta solo `GET /notificaciones/conteo`; la lista se pide al abrir el panel. El globo usa el total del servidor (`99+`), cada aviso tiene icono por grupo, fecha con hora y botón para quitarlo.
- **Mis reservas** (`/reservas/mis-reservas`): cancelar hasta el día anterior, aceptar o rechazar (con motivo) un cambio pedido por TICS y, si se aceptó, modificar sala, fecha u horario.
- **Control de Reservas**: "Pedir cambio" se oculta si la reserva ya tiene un cambio vigente o es de hoy; la agenda muestra la etiqueta "Cambio: pendiente / aceptada"; nueva sección **Solicitudes de cambio a profesores** con filtro por estado (respuesta del profesor y quién lo pidió).
- **Panel Mesa de Ayuda**: pestañas **Solicitudes** y **Buzón de correo**. El buzón muestra si la lectura automática está activa, la última revisión y el último error, el botón **Revisar ahora** y la tabla de correos leídos (filtro por resultado; "Ver #N" abre la solicitud).

### Módulo de logs (PR 3b)

Ver la decisión 15. Endpoints: `GET /api/bitacora`, `/api/bitacora/catalogos`, `/api/bitacora/csv` (Admin y Operador) y `GET /api/auditoria`, `/catalogos`, `/csv` (Admin). `EquipoVista` y `EquipoComputo` añaden `registradoPor`. Requiere aplicar `db/init/03-logs.sql` del backend.

### Integración con ServiceDesk y perfil (PR 2b y 3c, 2026-11-03)

Contrato completo en `CAMBIOS-FRONTEND-TICKETS-PERFIL.md` del backend. Requiere `db/init/04-tickets-correo.sql`.

- **Decisión 16 (correos de ServiceDesk)**: los avisos que envía `sdp_msdtic@uaemex.mx` al buzón de la UAP se aplican solos. El correo de creación asocia el ticket si su título lleva el folio (`SOL-<id>`; el panel sugiere el título completo y lo copia) o si solo hay una solicitud tomada; el de resolución o cierre cierra la solicitud y el solicitante recibe la resolución de la DTIC. Lo que no se puede asociar queda "Sin asociar" en la pestaña Buzón con **Asociar** y **Descartar**. La captura manual del ID sigue disponible y aplica los correos que ya habían llegado.
- **Decisión 17 (perfil)**: `/perfil` para cualquier rol (nombre y apellidos, contraseña). Solo Profesor y Alumno pueden eliminar su cuenta; antes se muestra qué se cancelará (reservas desde hoy, solicitudes sin ticket) y se pide la contraseña y escribir "ELIMINAR". Admin y Operador los elimina un Admin en Gestión de Usuarios.

### Cambio de correo desde el perfil (2026-11-03)

- Decisión: cualquier usuario puede cambiar su correo en **Mi perfil**, de forma directa y confirmando su contraseña (sin enlace de verificación). El correo debe ser institucional (`@uaemex.mx` o `@alumno.uaemex.mx`) y no estar en uso. El rol no cambia aunque cambie el dominio: solo el Admin cambia roles.
- Backend (modificado con autorización): `PUT /api/usuarios/me/correo {correoNuevo, password}` en `PerfilController`, `UsuarioService.cambiarMiCorreo` y `AuthDTOs.CambiarCorreoRequest`. Errores: `PASSWORD_ACTUAL_INCORRECTA` (400), `CORREO_NO_INSTITUCIONAL`, `CORREO_REGISTRADO`, `CORREO_SIN_CAMBIO`. Queda en la auditoría como `CAMBIAR_CORREO` (anterior → nuevo). No requiere cambios en la base de datos. La sesión sigue válida porque el JWT identifica al usuario por id.
- Frontend: `perfilService.cambiarCorreo` y la sección "Correo electrónico" en `features/perfil/pages/PerfilPage.tsx`; al guardar se actualiza el nombre/correo del usuario en sesión.

### Registro, verificación y recuperación de contraseña (PR 2, 2026-11-05)

Contrato en `CAMBIOS-FRONTEND-CUENTAS.md` del backend. Requiere `db/init/05-codigos-correo.sql`.

- **Decisión 18**: el correo de verificación y el de recuperación traen un código de 6 dígitos y un enlace; cualquiera de los dos sirve. Tras registrarse, el usuario pasa a `/verificar-correo` para escribir el código (con "Reenviar código" cada 60 s). En el login, `CORREO_NO_VERIFICADO` muestra un aviso con el enlace a esa página, y "¿Olvidaste tu contraseña?" lleva a `/olvide-password` (correo → código + nueva contraseña en la misma página). `/restablecer-password?token=` atiende el enlace del correo. Las cuatro páginas son públicas.

### Solicitudes externas: persona sin acceso a su correo institucional (2026-11-05)

Contrato en `CAMBIOS-FRONTEND-SOLICITUD-EXTERNA.md` del backend. Requiere `db/init/06-solicitudes-externas.sql`.

- **Decisión 19**: el Admin u Operador abre una **solicitud externa** desde el Panel Mesa de Ayuda ("Solicitud externa") con nombre, correo alterno (Gmail, Outlook…; nunca institucional), tipo y motivo. Queda APROBADA y la persona recibe un enlace de **72 h** a `/formulario-externo?token=`. Esa página es pública, tiene un **encabezado propio** (NavBar en modo externo, sin menú ni sesión) y avisa que si no envía sus datos la solicitud se rechaza. Puede corregirlos hasta que TIC toma la solicitud; después solo ve la etapa.
- Sin formulario a las 72 h, el backend la rechaza solo ("No se recibieron los datos…"), avisa por correo a la persona y con una notificación a quien la abrió. Desde el detalle se puede **reenviar el enlace** (nuevo, invalida el anterior, permite corregir el correo) mientras espera datos o si fue rechazada (la reabre), y **rechazarla** antes del ticket.
- La persona no ve el seguimiento: solo recibe el correo final de **resuelta** o **rechazada**. En el panel se distinguen con la etiqueta **Externa**, la bandeja "Externas" y un aviso en el detalle; `idUsuario` es `null` y `correoUsuario` es el correo alterno.
- Frontend: `CrearSolicitudExternaModal`, `EtiquetaExterna`, `FormularioExternoPage` (+ `app/formulario-externo/page.tsx`), `CamposFormularioDatos` (campos compartidos con el formulario del solicitante con cuenta), `ReenviarEnlaceModal` dentro de `DetalleAtencion`, y en `solicitudTecnicaService`: `crearExterna`, `reenviarEnlace`, `rechazarExterna`, `consultarFormularioExterno`, `llenarFormularioExterno`.

### Reservas del Admin y refresco de "Mis reservas" (2026-11-05)

Requiere `db/init/07-reservas-profesor-externo.sql` del backend.

- **Decisión 20**: el Admin puede modificar y cancelar **sus** reservas directamente (sala, fecha, horario, propósito), sin solicitud de cambio ni el límite del día anterior, mientras no hayan terminado: botón **Modificar** en la agenda de Reserva de Salas (solo en sus filas) y en Mis reservas (`PUT /mis-reservas/{id}/editar`).
- Al reservar, el Admin tiene el campo opcional **"Profesor sin cuenta"** para registrar la reserva a nombre de un profesor que no quiere registrarse. La reserva es del Admin (la ve y modifica en Mis reservas); la agenda y el Control de Reservas muestran el nombre del profesor con "Sin cuenta · registró <Admin>". A esas reservas no se les puede "Pedir cambio" (`PROFESOR_SIN_CUENTA`): se reasignan.
- **Corrección del refresco**: `clavesReservas.misReservas()` sin argumento devolvía `["mis-reservas", undefined]`, que React Query no empareja con `["mis-reservas", <id>]`; por eso al aceptar un cambio la pantalla no se actualizaba hasta recargar. Ahora devuelve el prefijo (igual `misSolicitudes` en reservas y mesa de ayuda). Además, al aceptar se actualiza la tarjeta al momento y se abre "Modificar reserva"; Mis reservas se vuelve a consultar cada minuto y al volver a la pestaña, y la campana recarga reservas, cambios y solicitudes cuando llega una notificación nueva o al abrir una.

### Avisos de cambio, ocupación al modificar y ayuda sin cuenta (2026-11-06)

- **Decisión 21**: las solicitudes de cambio de TIC, además de la campana, se resaltan en **Mis solicitudes** y en **Reserva de Salas** (bloque dorado "TIC te pide cambiar una reserva", con "Responder" / "Modificar"), y el botón "Mis reservas" muestra cuántas hay por atender (`features/reservas/components/CambiosPendientes.tsx`, misma caché que Mis reservas). Los enlaces y la notificación (`/reservas/mis-reservas?reserva=<id>`) llevan a la reserva, que se resalta y se desplaza a la vista; las tarjetas con un cambio por responder tienen borde dorado.
- Al modificar una reserva (profesor con cambio aceptado o Admin) se muestran las reservas de la sala y el día elegidos: la propia como "Tu reserva actual" y en rojo las que se empalman con el horario escrito.
- Ayuda de tickets (`/ayuda`): nueva sección **"¿No puedes registrarte en la plataforma?"** con el flujo de la solicitud externa (acudir a TIC, enlace al correo personal, formulario sin cuenta, vence en 72 h y se rechaza sola, aviso final por correo) y preguntas frecuentes relacionadas.

### Operador puede dar de baja equipos (2026-11-06)

- **Decisión 22**: `inventario.darDeBaja` pasa a Admin y Operador (formulario de inventario, formulario de equipo de cómputo, cambio masivo y finalizar mantenimiento sin reparación). Sacar un equipo de BAJA es el nuevo permiso `inventario.reactivar`, solo Admin; el backend responde `403 SOLO_ADMIN_BAJA` si un Operador lo intenta. Borrar el registro (`inventario.eliminar`) sigue siendo solo Admin.

### Organización de features por tipo (2026-11-11)

- **Decisión 23**: cada módulo de `src/features` se separa en `pages/`, `components/`, `modals/`, `hooks/` y `utils/`, con un `index.ts` que exporta lo que usa `app/` (y la campana que usa el `NavBar`). Nombres de carpetas en español.
- Cambios de nombre de módulo: `inventory` -> `inventario`, `admin/users` -> `usuarios`; `users/RegistroForm` pasa a `auth/components`; `admin/ConfigAgendaPanel` pasa a `reservas/components`; `informacion/Bloques` y `landing/LandingSessionActions` pasan a `publico/components`.
- Solo se movieron archivos y se ajustaron importaciones; no cambia el comportamiento ni la interfaz. 73 archivos movidos y 11 `index.ts` nuevos.
