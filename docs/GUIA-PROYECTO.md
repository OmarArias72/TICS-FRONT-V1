# Guía del proyecto Control TIC (frontend `tic-cuut`)

Documento de contexto para personas y agentes que trabajen en este repositorio. Resume qué es el sistema, cómo está organizado, cómo se ejecuta y qué convenciones seguir. El detalle de la migración, las decisiones y los pendientes del backend está en [`docs/MIGRACION.md`](./MIGRACION.md).

> Antes de escribir código de Next.js, lee también `AGENTS.md`: esta versión de Next.js (16.4) cambia APIs y convenciones; la documentación local está en `node_modules/next/dist/docs/`.

---

## 1. Qué es

**Control TIC** es el sistema web del área de Tecnologías de la Información del **Centro Universitario UAEM Tianguistenco**. Permite:

- Gestionar el **inventario** de equipos (altas, bajas, conteos, reportes PDF/CSV).
- Ver el **Mapa de Aulas**: salas y estado de cada computadora.
- **Reservar salas** (profesores) y **controlar reservas** (administración).
- Atender la **Mesa de Ayuda**: solicitudes de restablecimiento de contraseña o autenticador y otros problemas, que terminan en un ticket de ServiceDesk.
- **Administrar usuarios** y roles.

Este repositorio es la migración a **Next.js 16 + TypeScript** de un frontend anterior en React + Vite. Los cinco módulos ya están migrados (ver la tabla de `MIGRACION.md`).

### Carpetas relacionadas (en la máquina del desarrollador)

| Carpeta | Contenido | Reglas |
| --- | --- | --- |
| `C:\Users\omara\Documents\TICS-FRONT-NEXT\tic-cuut` | **Este proyecto** (Next.js) | Aquí se trabaja |
| `C:\Users\omara\Documents\TICS-FRONT-NEXT\pr-descripciones` | Descripciones de cada PR en Markdown (`prN-....md`) | Una por PR |
| `C:\Users\omara\Documents\TICS-FRONT-END\TIC-UAEMEX-WEB\TIC-CUUT` | Frontend original (React + Vite) | **Solo lectura**, referencia |
| `C:\Users\omara\Documents\JAVA-BACK\TICS-BACKEND` | Backend Spring Boot | **No modificar sin autorización explícita** del responsable |

Repositorio remoto: `git@github.com:OmarArias72/TICS-FRONT-V1.git`, rama principal `main`.

---

## 2. Tecnologías

| Área | Librería | Versión | Uso |
| --- | --- | --- | --- |
| Framework | `next` | 16.4.3 | App Router, Turbopack, Cache Components |
| UI | `react`, `react-dom` | 19.3 | Con React Compiler activo en las reglas de ESLint |
| Lenguaje | `typescript` | 5.9 | `strict: true` |
| Estilos | `tailwindcss` 4 + `@tailwindcss/turbopack` | 4 | Tokens de color en `@theme` (`src/app/globals.css`) |
| Peticiones | `axios` | 1.x | Cliente único en `src/lib/api/client.ts` |
| Datos del servidor | `@tanstack/react-query` | 5 | Caché, reintentos, invalidación |
| Estado global | `zustand` | 5 | Solo la sesión (`src/store/authStore.ts`) |
| Formularios | `react-hook-form` + `zod` + `@hookform/resolvers` | 7.91 / 4.6 / 6.0 | Validación con esquemas |
| Avisos | `react-hot-toast` | 2.6 | Avisos emergentes |
| Iconos | `lucide-react` | 1.63 | **No se usan emojis** en código ni interfaz |
| Animación | `framer-motion` | 14.7 | Solo detalles (cuadrícula del Mapa de Aulas), respeta `useReducedMotion` |
| Lint | `eslint` 9 + `eslint-config-next` | 16.4.3 | `core-web-vitals` + `typescript` |
| Paquetes | `pnpm` | 12.16.1 | `packageManager` fijado en `package.json` |
| Node | — | 26.x | Versión usada en desarrollo |

No hay pruebas automáticas ni CI (decisión del proyecto); se valida con `pnpm lint`, `pnpm build` y pruebas manuales por rol.

---

## 3. Cómo ejecutar

### Backend (requisito)

En `TICS-BACKEND` (Java 25, Spring Boot 4.1, PostgreSQL 17):

```bash
docker compose up -d db        # PostgreSQL en localhost:5432 (pgAdmin opcional en :5050)
./mvnw spring-boot:run         # API en http://localhost:8080
```

El esquema inicial está en `db/init/01-schema.sql`; `DataSeeder` crea roles, tipos de solicitud y un usuario administrador.

### Frontend

```bash
pnpm install
cp .env.example .env.local     # ajustar BACKEND_URL si hace falta
pnpm dev                       # http://localhost:3000
pnpm lint                      # sin errores antes de cada commit
pnpm build                     # debe compilar sin errores
```

### Variables de entorno

| Variable | Dónde se lee | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `BACKEND_URL` | Solo servidor (`next.config.ts`) | `http://localhost:8080` | Destino del rewrite `/api/*`. No lleva `NEXT_PUBLIC_`, así que nunca llega al navegador |

- `.env.local` no se sube al repositorio (`.gitignore`); `.env.example` sí.
- No hay variables `NEXT_PUBLIC_*`. Si se agrega alguna, documentarla aquí y en `.env.example`.
- **Nunca** copiar ni imprimir valores de `.env.local` ni credenciales del backend.

---

## 4. Estructura de directorios

```
tic-cuut/
├── AGENTS.md                  Reglas de Next.js para agentes (lo regenera `next dev`)
├── docs/
│   ├── MIGRACION.md           Plan, decisiones, riesgos, cambios pendientes del backend
│   └── GUIA-PROYECTO.md       Este documento
├── next.config.ts             cacheComponents, partialPrefetching, rewrite /api -> backend
├── eslint.config.mjs
├── tsconfig.json              Alias @/* -> src/*
├── .env.example
└── src/
    ├── app/                   Rutas (App Router)
    │   ├── layout.tsx         Raíz: <html lang="es">, Providers, NavBar, Footer
    │   ├── page.tsx           Portada (Server Component)
    │   ├── globals.css        Tailwind + tokens de color y fuentes
    │   ├── login/, registro/, unauthorized/, not-found.tsx
    │   ├── dev/componentes/   Catálogo de componentes (404 en producción)
    │   └── (protected)/       Grupo con sesión obligatoria
    │       ├── layout.tsx     <Suspense> + <AuthGuard>
    │       ├── aulas/                         Mapa de Aulas
    │       ├── inventario/, inventario/conteo/
    │       ├── reservas/, reservas/mis-solicitudes/, reservas/mis-reservas/
    │       ├── solicitudes-tecnicas/          Mesa de Ayuda (solicitante)
    │       └── admin/
    │           ├── reservas/                  Control de Reservas
    │           ├── config-agenda/             Apertura / Cierre (pendiente de backend)
    │           ├── solicitudes-tecnicas/      Panel Mesa de Ayuda
    │           └── usuarios/                  Gestión de Usuarios
    ├── components/
    │   ├── layout/            NavBar (menú lateral + campana), Footer
    │   ├── providers/         QueryClient y rehidratación de la sesión
    │   └── ui/                Componentes compartidos (ver sección 8)
    ├── features/              Lógica y pantallas por módulo
    │   ├── auth/              AuthGuard, LoginForm, usePermiso
    │   ├── admin/             users/ (gestión de usuarios), ConfigAgendaPanel
    │   ├── aulas/             Mapa de Aulas
    │   ├── inventory/         Inventario y conteos
    │   ├── reservas/          Reserva y control de salas
    │   ├── mesa-ayuda/        Solicitudes técnicas
    │   ├── notificaciones/    Campana (pendiente de backend)
    │   ├── users/             Registro público
    │   ├── landing/, dev/
    ├── hooks/                 useDebouncedValue
    ├── lib/
    │   ├── api/               client.ts, errors.ts, funcionesBackend.ts, services/*
    │   ├── auth/              permisos.ts (matriz), roles.ts (rutas y menú)
    │   ├── validation/        password.ts
    │   ├── estados.ts         Estado del backend -> { tono, etiqueta }
    │   ├── fechas.ts          Fechas en hora local
    │   ├── download.ts, cn.ts
    ├── store/authStore.ts     Sesión (zustand + localStorage "tic-auth")
    └── types/api/*.ts         Contratos con el backend
```

Cada carpeta de `features/<modulo>/` suele tener: la página (`*Page.tsx`), sus modales, `schemas.ts` (zod), `claves.ts` (claves de React Query) y archivos de reglas puras (`reglas.ts`, `flujo.ts`, `equipos.ts`). Las páginas de `app/` solo importan el componente del módulo y definen `metadata`.

---

## 5. Arquitectura

### Comunicación con el backend

- El navegador siempre llama a **`/api/...` en el mismo origen**. `next.config.ts` reenvía esas rutas a `BACKEND_URL`. Así no dependemos del CORS del backend.
- `src/lib/api/client.ts`: instancia de axios con `baseURL: "/api"`.
- `src/lib/api/errors.ts`: `request(peticion, mensajePorDefecto, mensajesPorEstado?)` envuelve cada llamada y lanza `ApiError` con `message`, `status`, `codigo` (estable, por ejemplo `MISMO_DIA` o `LIMITE_ACTIVAS`), `detalles` por campo y `reintentarEn`. Los componentes muestran `error.message` y reaccionan con `esCodigo(error, "...")`.
- `src/lib/api/services/*Service.ts`: un objeto por controlador del backend. **Toda petición pasa por aquí**; los componentes no usan axios directamente.

### Sesión y permisos

- **Sesión con JWT en cookies httpOnly** (backend v4): `POST /api/auth/login` deja las cookies `tic_access` (15 min) y `tic_refresh` (7 días) y responde `{ usuario, accesoExpiraEnSegundos }`. El frontend nunca lee el token; `store/authStore.ts` guarda solo el usuario en memoria (no en `localStorage`).
- Al cargar la app, `Providers` llama a `GET /api/auth/me`. `lib/api/client.ts` renueva la sesión con `POST /api/auth/refresh` ante un 401 y repite la petición; si no se puede, `AuthGuard` envía a `/login?next=...`.
- Ningún endpoint recibe `idUsuario` ni `idAdmin`: el backend toma el usuario de la sesión y aplica la misma matriz de permisos. La protección de rutas del frontend es de experiencia de usuario; la seguridad real está en el backend.
- `src/lib/auth/permisos.ts` define la matriz `PERMISOS` (acción -> roles). `tienePermiso(rol, permiso)` y el hook `usePermiso("...")` la consultan.
- `src/lib/auth/roles.ts` define `RUTAS_PROTEGIDAS` (ruta -> permiso, etiqueta del menú), `INICIO_POR_ROL` y `destinoTrasLogin`. El `AuthGuard`, el menú y los botones usan las mismas tablas.
- Cerrar sesión llama a `POST /api/auth/logout` y hace `location.assign("/login")` (recarga completa) para que Cache Components no conserve datos del usuario anterior.

### Next.js 16: puntos que hay que respetar

- `cacheComponents: true`: al navegar, la página anterior se **oculta** (React `<Activity>`), no se desmonta. Un `<dialog>` abierto seguiría bloqueando la página visible; `components/ui/Modal.tsx` lo cierra al ocultarse. Cualquier overlay nuevo debe hacer lo mismo.
- `useSearchParams` necesita un `<Suspense>` por encima (ver `app/(protected)/aulas/page.tsx`).
- El middleware se llama `proxy` en esta versión (no se usa por ahora).
- Todo acceso a `window`, `localStorage` o `document` va en efectos o manejadores, nunca durante el render (los Client Components también se prerenderizan).

---

## 6. Roles, rutas y permisos

Ids de rol (tabla `roles`): Admin 1, Operador-tics 2, Profesor 3, Estudiante 4.

| Ruta | Permiso | Admin | Operador-tics | Profesor | Estudiante |
| --- | --- | --- | --- | --- | --- |
| `/aulas` | `salas.ver` | Sí | Sí | — | — |
| `/inventario`, `/inventario/conteo` | `inventario.ver`, `inventario.conteos` | Sí | Sí | — | — |
| `/reservas` (+ `mis-solicitudes`, `mis-reservas`) | `reservas.reservar` | Sí (opcional) | — | Sí | — |
| `/solicitudes-tecnicas` | `mesaAyuda.solicitar` | — | — | Sí | Sí |
| `/admin/reservas` | `reservas.gestionar` | Sí | Sí | — | — |
| `/admin/config-agenda` | `agenda.configurar` | Sí | — | — | — |
| `/admin/solicitudes-tecnicas` | `mesaAyuda.atender` | Sí | Sí | — | — |
| `/admin/usuarios` | `usuarios.gestionar` | Sí | — | — | — |

Permisos de acción dentro de las pantallas (además de los de ruta): `salas.gestionar` (solo Admin), `equipos.gestionar` y `equipos.verContrasenas` (Admin y Operador), `inventario.eliminar` e `inventario.darDeBaja` (solo Admin), `inventario.estadoMasivo` y `inventario.reportes` (Admin y Operador).

Página inicial tras el login: Admin `/admin/reservas`, Operador `/inventario`, Profesor `/reservas`, Estudiante `/solicitudes-tecnicas`.

---

## 7. API del backend

> La referencia completa de los endpoints (107) y sus reglas está en la sección 9 del `AGENTS.md` del backend y, para la fase 2, en `CAMBIOS-FRONTEND-FASE2.md`. Esta tabla resume los que usa el frontend.

Todas bajo `/api`. Tipos en `src/types/api/`, servicios en `src/lib/api/services/`.

| Módulo | Servicio | Endpoints principales |
| --- | --- | --- |
| Sesión | `authService` | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/registro` |
| Configuración | `configuracionService` | `GET /configuracion/modulos/RESERVAS`, `PUT /configuracion/modulos/RESERVAS` (Admin) |
| Usuarios | `usuarioService` | `GET /usuarios/roles`, `POST /usuarios/{id}/desbloquear`, `GET /usuarios`, `GET /usuarios/{id}`, `POST /usuarios/admin/crear`, `PUT /usuarios/{id}`, `DELETE /usuarios/{id}` |
| Salas | `salaService` | `GET /salas`, `GET /salas/{id}`, `GET /salas/buscar?query=`, `POST /salas`, `PUT /salas/{id}`, `DELETE /salas/{id}` |
| Equipos de cómputo | `equipoComputoService` | `GET /equipos-computo`, `GET /equipos-computo/{id}`, `GET /equipos-computo/inventario/{inv}`, `GET /equipos-computo/sala/{idSala}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Inventario | `inventoryService` | `GET /inventory/equipos`, `POST /inventory/buscar-por-{serie,marca,modelo,articulo}`, `POST /inventory/buscar-global`, `POST /inventory/crear`, `POST /inventory/crear-equipo-movil`, `PUT /inventory/{inv}`, `DELETE /inventory/{inv}`, `PATCH /inventory/estado-masivo`, `GET /inventory/conteo`, `GET /reportes/equipos/{pdf,csv}` |
| Reservas | `reservaSalasService` | `GET /reservas-salas/agenda?idSala=&fecha=`, `POST /reservar`, `POST /solicitud-extra`, `GET /mis-solicitudes?idUsuario=`, `GET /admin/solicitudes-pendientes`, `POST /admin/aprobar-solicitud`, `POST /admin/rechazar-solicitud`, `PUT /admin/reasignar`, `PUT /admin/cancelar` |
| Mesa de Ayuda | `solicitudTecnicaService` | `GET /solicitudes-tecnicas/catalogos/tipos`, `GET /mis-solicitudes`, `POST /crear`, `PUT /{id}/reenviar`, `PUT /{id}/formulario`, `PUT /{id}/cancelar`, `GET /admin/panel?filtro=`, `POST /admin/{id}/aprobar`, `/rechazar`, `/bloquear`, `/capturar-ticket`, `/resolver-ticket` |
| Notificaciones | `notificacionService` | **Pendiente de backend**: `GET /notificaciones`, `PUT /notificaciones/{id}/leida`, `PUT /notificaciones/leidas` |

### Funciones pendientes de backend

`src/lib/api/funcionesBackend.ts` tiene banderas (`notificaciones`, `misReservas`, `solicitudesCambio`) en `false`. Mientras estén así, las pantallas muestran "Pendiente de backend" y no hacen peticiones. Los endpoints que faltan, las tablas SQL y las reglas están especificados en `MIGRACION.md`, sección 7. Cuando el backend los tenga, se cambia la bandera a `true`.

### Particularidades de los contratos

- Algunos GET devuelven la **entidad JPA** (no un DTO): `Sala`, `EquipoComputo` (con `equipo`, `modelo`, `marca` y `sala` anidados).
- Los mappers de reservas **no llenan** todos los campos de sus DTO; en `types/api/reserva.ts` esos campos son opcionales y están marcados "No se envía hoy".
- `ValorConocido<T>` (en `common.ts`) = valores conocidos del backend más cualquier `string`, para columnas `varchar` que pueden traer otros valores.
- Fechas: `IsoDate` (`YYYY-MM-DD`), `IsoDateTime` (LocalDateTime sin zona), `HoraMinutos` (`HH:mm`). Usar `lib/fechas.ts` (`hoyISO`, `formatearFecha`, `formatearDia`...) que trabaja en **hora local**; no usar `toISOString()` para "hoy".

---

## 8. Interfaz y convenciones de código

### Diseño

- Paleta institucional (tokens en `globals.css`, úsalos como clases Tailwind: `bg-verde`, `text-dorado-texto`, `bg-error-claro`...):
  - Verde `#164E33` / claro `#B7EBCB` / oscuro `#002112`; Dorado `#D4A017` / claro `#FCEFC7` / oscuro `#3E2E00` / texto `#8A6500`.
  - Superficie `#F7FAF7`, Sobre superficie `#191C1A`, Variante `#DCE5DD`, Sobre variante `#414942`, Outline `#717971`.
  - Estados: `error`, `alerta`, `info` (cada uno con `-claro` y `-oscuro`).
- No usar colores fijos (`#...`, `slate-*`) en componentes; no usar emojis; iconos de `lucide-react` con `aria-hidden="true"` cuando son decorativos.
- El prototipo aprobado ("Prototipo Control TIC") define la apariencia: encabezado con *eyebrow* dorado, tarjetas blancas con borde `variante`, botones de 44 px, chips de filtro redondos con contador.

### Componentes compartidos (`@/components/ui`)

`Button`, `ButtonLink`, `buttonClasses`, `IconButton` (requiere `label`), `Card`, `CardHeader`, `PageHeader`, `PageContainer` (`narrow` para lectura), `Table`/`THead`/`TH`/`TR`/`TD`/`TableMessage`, `Modal` (`<dialog>` nativo), `ConfirmDialog`, `MotivoModal` (un campo de texto obligatorio), `Alert` (tonos `info`, `alerta`, `error`, `ok`, `neutro`), `FormField` + `Input`/`Select`/`Textarea`/`Label`, `StatusBadge`, `CountBadge`, `EmptyState`, `PageLoader`, `PasswordChecklist`. El catálogo visual está en `/dev/componentes` (solo en desarrollo).

`lib/estados.ts` convierte cada estado del backend en `{ tono, etiqueta }`: `<StatusBadge {...estadoEquipo(e.estado)} />`.

### Patrones obligatorios

- **Formularios**: react-hook-form + zod (`schemas.ts` del módulo). Para leer valores mientras se escribe, usar `useWatch` (no `watch()`, que choca con el React Compiler).
- **Modales con formulario**: el `Modal` monta un componente interno solo cuando está abierto y con `key` por registro; los valores iniciales salen de `useState(() => ...)`. **No** reiniciar formularios con `useEffect` + `setState` (regla `react-hooks/set-state-in-effect`).
- **Datos del servidor**: React Query con claves centralizadas en `features/<modulo>/claves.ts`. Tras una mutación, invalidar las claves afectadas (también las de otros módulos si comparten datos, por ejemplo Mapa de Aulas -> Inventario).
- **Selección en listas**: guardar el **id** seleccionado y buscar el objeto en los datos actuales, para que el detalle refleje los cambios tras refrescar.
- **Accesibilidad**: `FormField` enlaza etiqueta, ayuda y error; filtros con `aria-pressed`; textos solo para lectores con `sr-only`.
- **Idioma**: interfaz, comentarios y documentación en español; nombres de componentes en PascalCase (español o inglés según el módulo de origen).

### Reglas de negocio implementadas en el frontend

- **Contraseñas de usuario** (`lib/validation/password.ts`): 8 a 64 caracteres, mayúscula, minúscula, número, sin espacios. El Admin no puede eliminarse, desactivarse ni cambiar su propio rol.
- **Reservas** (`features/reservas/reglas.ts`): reserva directa desde hoy hasta 30 días, fin posterior al inicio, sin empalmes; si no se cumple, se ofrece una solicitud extraordinaria. El profesor cancela o modifica su reserva solo **hasta el día anterior**.
- **Mesa de Ayuda** (`features/mesa-ayuda/flujo.ts`): PENDIENTE -> APROBADA -> FORMULARIO_ENVIADO -> ESPERA_TICKET -> TICKET_CREADO -> CERRADA (más RECHAZADA y CANCELADA). Máximo 3 solicitudes activas y una por tipo cada 24 h (lo valida el backend).
- **Inventario y Mapa de Aulas**: el Operador no puede dar de BAJA ni eliminar; el número de inventario no se cambia en un equipo existente.

---

## 9. Flujo de trabajo

1. Partir de `main` actualizado: `git switch main && git pull`, luego `git switch -c feat/<tema>`.
2. Hacer el cambio; actualizar `docs/MIGRACION.md` si hay una decisión, un riesgo o un cambio de comportamiento.
3. `pnpm lint` y `pnpm build` sin errores; probar con cada rol afectado.
4. Commit con mensaje convencional en inglés (`feat: ...`, `fix: ...`), push y PR hacia `main`; la descripción va en `../pr-descripciones/prN-<tema>.md`. Se fusiona con "Create a merge commit".

### Reglas para agentes

- Pregunta con opciones antes de decisiones importantes; comunica en español claro (el responsable es estudiante).
- No modifiques `TIC-UAEMEX-WEB` (original) ni `TICS-BACKEND` sin autorización explícita; documenta lo que el backend necesite en `MIGRACION.md`.
- Nada de comandos git destructivos, ni commit, merge o push sin autorización.
- No reveles ni copies credenciales ni valores de `.env.local`.
- Nada de emojis en código, comentarios o interfaz.

---

## 10. Riesgos conocidos del backend (resumen)

Detalle en `MIGRACION.md`, sección 5. Los más importantes:

- Sin autenticación real: los ids de usuario viajan como parámetros y no se verifican.
- Contraseñas de usuarios y de equipos guardadas y devueltas en texto plano.
- La CURP se cifra con una clave escrita en el código y el panel la devuelve descifrada sin verificar el rol.
- CORS con `allowedOriginPatterns("*")` y credenciales.
- Comparaciones de ids `Integer` con `!=` en la Mesa de Ayuda (fallan con ids mayores a 127).
- Cambio autorizado ya aplicado en el backend: `EquipoComputo.sala` en `FetchType.EAGER` (antes provocaba error 500 en `GET /equipos-computo`).
