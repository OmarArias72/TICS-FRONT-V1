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
| Inventario (2 páginas, 7 componentes) | `features/inventory/**` | A: pestañas Equipos/Conteos, búsqueda con espera, reporte en modal, permisos por acción; corrige marca/modelo | `features/inventory/**` + `/inventario`, `/inventario/conteo` | Hecho |
| Mapa de aulas (1 página, 5 componentes, 5 modales) | `features/classroom-map/**` | A: salas con barra de estado; cuadrícula de PC por estado con panel lateral; formulario con react-hook-form + zod; resumen simplificado; sala abierta en la URL. Se descartan `ClassroomCanvasMap`, `RoomInfoModal` y `RoomSummaryModal`, que no se usaban | `features/aulas/**` + `/aulas` | Hecho |
| Reservas (3 páginas, 2 componentes, 6 modales) | `features/salas/**` | A: reglas de reserva en `reglas.ts`, reserva directa o solicitud en un solo modal, control de reservas con aprobar / rechazar / reasignar / cancelar | `features/reservas/**` + `/reservas`, `/reservas/mis-solicitudes`, `/admin/reservas` | Hecho |
| Mesa de ayuda (2 páginas, 2 componentes, 3 modales) | `features/solicitudes-tecnicas/**` | A: tarjetas con progreso por pasos (prototipo); panel con bandejas, lista y detalle lateral; validaciones del formulario iguales al backend; cierre automático al resolver | `features/mesa-ayuda/**` + `/solicitudes-tecnicas`, `/admin/solicitudes-tecnicas` | Hecho |
| Gestión de usuarios (1 página, 5 componentes) | `features/admin/users/**` | A: react-hook-form + zod; corrige el rol que se perdía al editar; protege la cuenta propia; reglas de contraseña | `features/admin/users/**` + `/admin/usuarios` | Hecho |
| AdminReservaSalasPage | `features/admin/pages/AdminReservaSalasPage.jsx` | R: el `idAdmin` sale de la sesión dentro de `ControlReservasPage` | `app/(protected)/admin/reservas/page.tsx` | Hecho |
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
9. **Inventario** (2026-10-30): búsqueda en el backend mientras se escribe (300 ms, conserva el selector de tipo); reporte PDF/CSV en un modal con fechas, artículo y formato; Conteos como pestaña con su propia URL; el Operador puede corregir datos de un equipo en BAJA pero no cambiar su estado, ni seleccionarlo para el cambio masivo.
10. **Reservas** (2026-10-30): horario y duración libres (solo fin posterior al inicio); reserva directa desde hoy hasta 30 días (`MAX_DIAS_ANTICIPACION`), nunca en el pasado; si el horario se empalma o supera los 30 días, el mismo modal ofrece una solicitud extraordinaria con justificación obligatoria. Si el backend rechaza una reserva directa, el modal pasa a modo solicitud con su mensaje. En Control de Reservas, rechazar y cancelar exigen motivo; aprobar y reasignar avisan de empalmes antes de enviar; una fecha pasada se muestra solo como consulta.
11. **Cambios de reserva por la administración y notificaciones** (2026-10-30): el admin puede pedir al profesor, con un mensaje, que cambie su reserva de sala o fecha. Si el profesor acepta, él mismo la modifica desde "Mis reservas"; si no puede, responde con un motivo. El admin conserva la opción de reasignar directamente. El profesor puede cancelar su reserva y modificarla (con un cambio aceptado) solo hasta el día anterior; el mismo día, cualquier cambio lo hace TICS. Las reasignaciones, cancelaciones, aprobaciones, rechazos y solicitudes de cambio generan notificaciones que se ven en una campana en la barra superior. Todo esto depende de endpoints nuevos (sección 7); mientras no existan, las banderas de `lib/api/funcionesBackend.ts` están en `false` y las pantallas muestran "Pendiente de backend".
12. **Mesa de Ayuda** (2026-10-30): al resolver el ticket la solicitud queda cerrada sin confirmación del solicitante (se quita "Confirmar resolución", que nunca funcionaba); el enlace a ServiceDesk apunta a la página general `https://msdtic.uaemex.mx/`; el panel de Admin y Operador es una lista con detalle lateral y bandejas Por revisar / Listas para ticket / Ticket en TICS / Todas, calculadas a partir de una sola consulta; la CURP se muestra oculta hasta pedirla; el solicitante recibirá avisos en la campana cuando su solicitud se apruebe, se rechace o se resuelva (pendiente de backend, sección 7.6).
13. **Mapa de Aulas** (2026-10-30): los equipos se cargan con `GET /equipos-computo` y se agrupan por sala en el navegador, como en el original; dentro de una sala, cuadrícula de PC coloreadas por estado con filtros y panel lateral de detalle; las contraseñas aparecen ocultas, con botones para mostrar y copiar cada una (solo Admin y Operador); el resumen de sala muestra estados, sistemas operativos y periféricos con falla, sin el conteo de software por palabras clave. El formulario permite mover un equipo a otra sala y, igual que en Inventario, el Operador no puede dar de BAJA.
14. **Pruebas automáticas y CI** (2026-10-30): ninguna por ahora; se valida con `pnpm lint`, `pnpm build` y pruebas manuales por rol.

## 5. Riesgos conocidos del backend

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

## 7. Cambios requeridos en el backend (pendientes)

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
- El límite del profesor se valida en el servidor: `uso.getFechaInicio().toLocalDate().isAfter(hoy)`. El frontend aplica la misma regla en `profesorPuedeCambiar` (`features/reservas/reglas.ts`), pero no es suficiente por sí sola.
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
