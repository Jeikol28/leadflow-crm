# Diagnóstico técnico — LeadFlow CR

> Análisis de solo lectura realizado el 2026-06-10. No se modificó ningún archivo de backend ni frontend. Todas las observaciones están basadas en el código real encontrado en el repositorio.

---

## 1. Resumen general del proyecto

LeadFlow es un CRM SaaS multiempresa para PYMEs y equipos comerciales en Costa Rica. La solución está dividida en dos grandes bloques dentro de la misma carpeta raíz:

- `Backend/LeadFlow` → API REST en **ASP.NET Core 8** con arquitectura limpia (Clean Architecture) en 4 proyectos. Está **muy avanzado y bien documentado**: cubre prácticamente todos los módulos del CRM (auth, clientes, leads, pipeline, tareas, interacciones, servicios, cotizaciones, reportes, dashboard, alertas, auditoría, configuración, onboarding e IA simulada).
- `Frontend/LeadFlow.Frontend` → SPA en **React 19 + Vite + TypeScript + Tailwind v4**. Está en **fase inicial**: landing, login, registro y un dashboard visual completo pero alimentado **100% con datos mock**. Solo la autenticación está realmente conectada al backend.

**Conclusión rápida:** el backend va muy por delante del frontend. El trabajo pendiente es esencialmente *frontend* + *integración*: consumir endpoints que ya existen y reemplazar mocks por datos reales, módulo por módulo. El backend ya expone casi todo lo necesario.

---

## 2. Stack detectado en frontend

Fuente: `Frontend/LeadFlow.Frontend/package.json`.

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework UI | React | 19.2 |
| Bundler / dev | Vite | 8.0 |
| Lenguaje | TypeScript | ~6.0 |
| Estilos | Tailwind CSS (`@tailwindcss/vite`) | 4.3 |
| Router | **@tanstack/react-router** (activo) | 1.170 |
| Router | **react-router-dom** (instalado, código muerto) | 7.17 |
| HTTP | axios | 1.17 |
| Animación | framer-motion | 12.40 |
| Gráficos | recharts | 3.8 |
| Iconos | lucide-react | 1.17 |
| Formularios | react-hook-form | 7.78 (instalado, aún sin uso real) |
| Validación | zod | 4.4 (instalado, aún sin uso real) |
| Gestor paquetes | pnpm (`pnpm-lock.yaml`) | — |

Observación: hay **dos routers y dos lockfiles** (`package-lock.json` y `pnpm-lock.yaml`) conviviendo. Ver sección 12.

---

## 3. Stack detectado en backend

Fuente: `.csproj`, `Program.cs`, `appsettings.json`, `Docs/`.

- **Lenguaje/Framework:** C# / ASP.NET Core 8 Web API (`net8.0`, nullable + implicit usings habilitados).
- **Arquitectura:** Clean Architecture en 4 proyectos:
  - `LeadFlow.Domain` → entidades y modelo de dominio (sin dependencias).
  - `LeadFlow.Application` → DTOs e interfaces de servicios (contratos).
  - `LeadFlow.Infrastructure` → implementación de servicios, EF Core, `DbContext`, servicios externos (JWT, PDF, email).
  - `LeadFlow.Api` → controladores, middleware, configuración (DI, CORS, JWT, Swagger, rate limiting).
- **ORM / BD:** Entity Framework Core sobre **SQL Server** (`UseSqlServer`). DB local en desarrollo.
- **Autenticación:** JWT Bearer + refresh tokens hasheados en BD.
- **Documentación API:** Swagger/Swashbuckle con soporte de Bearer.
- **Seguridad transversal:** rate limiting nativo (.NET `RateLimiter`), CORS por orígenes configurados, middleware global de errores, bloqueo por intentos fallidos de login, separación multiempresa por `CompanyId` desde el token.

> **Nota:** según las reglas que diste, el backend solo se documenta, no se modifica ni se planifican cambios sobre él. Todo lo de abajo sobre backend es descriptivo.

---

## 4. Estructura del frontend

```
src/
├── App.tsx                 # Monta RouterProvider con TanStack Router
├── main.tsx                # Entry point; envuelve App en <AuthProvider>
├── index.css / App.css     # Estilos globales (Tailwind)
├── app/
│   ├── layouts/
│   │   ├── AppLayout.tsx    # Shell privado (sidebar + topbar) + guard de sesión
│   │   └── PublicLayout.tsx # Shell público (landing/login/registro)
│   ├── providers/
│   │   └── AuthProvider.tsx # Contexto global de sesión (login/register/logout/restore)
│   └── routes/
│       ├── tanstackRouter.tsx  # ✅ Router ACTIVO (lazy routes)
│       └── AppRouter.tsx       # ❌ Router react-router-dom — CÓDIGO MUERTO
├── features/
│   ├── auth/               # LoginPage, RegisterPage, authService.ts (conectado)
│   ├── dashboard/          # DashboardPage + 8 componentes + data/mock.ts (mock)
│   └── landing/            # LandingPage + 9 secciones
└── shared/
    ├── api/httpClient.ts   # axios centralizado + interceptor de token
    ├── components/motion/Reveal.tsx
    ├── types/auth.types.ts # Tipos de auth (alineados con DTOs backend)
    └── utils/authStorage.ts # Tokens en localStorage
```

La organización **feature-based** (`features/`, `shared/`, `app/`) es buena y escalable. Hay además: skills de diseño en `.agents/skills/`, `PRODUCT.md` con principios de marca, carpetas `stitch-reference/` y `output/` (referencias de diseño) y `dist/` (build).

---

## 5. Estructura del backend

```
Backend/LeadFlow/
├── LeadFlow.Api/
│   ├── Controllers/        # 19 controladores (uno por módulo)
│   ├── Middleware/         # ExceptionHandlingMiddleware
│   ├── Models/             # ApiErrorResponse
│   ├── Services/Common/    # CurrentUserService
│   └── Program.cs          # DI, CORS, JWT, Swagger, rate limiting
├── LeadFlow.Application/
│   ├── DTOs/               # Request/Response por módulo (AI, Alerts, Auth, ...)
│   └── Interfaces/         # Contratos de servicios por módulo
├── LeadFlow.Domain/
│   └── Entities/           # 14 entidades
├── LeadFlow.Infrastructure/
│   ├── Data/LeadFlowDbContext.cs
│   ├── ExternalServices/Auth/JwtTokenService.cs
│   ├── Repositories/       # (vacío — sin patrón repositorio)
│   ├── Migrations/         # (vacío — sin migraciones EF)
│   └── Services/           # Implementaciones por módulo
└── Docs/                   # Backend-Estado-Actual.md, Backend-Guia-Frontend.md, SQL script
```

**Capas existentes:** Domain → Application (contratos) → Infrastructure (implementación) → Api (exposición). El registro de dependencias en `Program.cs` confirma que cada módulo tiene su interfaz en Application y su servicio en Infrastructure.

**Entidades (Domain/Entities):** `Company`, `User`, `Customer`, `Lead`, `LeadStatus`, `Interaction`, `TaskItem`, `ServiceItem`, `Quote`, `QuoteItem`, `AuditLog`, `RefreshToken`, `PasswordResetToken`, `AiChatLog`.

**DTOs (Application/DTOs):** un set Request/Response por módulo, incluyendo paginación común (`PagedRequest`/`PagedResponse`).

**Services:** la lógica vive en `Infrastructure/Services/<Módulo>` (Customers, Leads, LeadStatuses, Interactions, Tasks, ServiceItems, Quotes —con `QuotePdfService` y `QuoteEmailService`—, Users, Dashboard, Reports, CompanySettings, Alerts, AuditLogs, Onboarding, AI —`AiContextService` + `AiChatService`—, Auth).

**Repositories:** la carpeta existe pero está **vacía**. El acceso a datos se hace directamente con el `DbContext` dentro de los servicios (patrón válido, sin capa repositorio explícita).

**DbContext:** `LeadFlowDbContext` con 14 `DbSet`, relaciones configuradas en `OnModelCreating` (FKs por `CompanyId`, índices únicos en `Users.Email` y en `LeadStatus(CompanyId, Name)`, mapeo `TaskItem → Tasks`).

**Autenticación/Autorización:** JWT validado en `Program.cs` (issuer, audience, lifetime, signing key). Roles detectados en uso: `AdminEmpresa`, `Gerente`, `Vendedor`, `Soporte`. Restricciones por rol vía `[Authorize(Roles=...)]` en Reports, AuditLogs, Users, CompanySettings (PUT), DatabaseTest.

**Validaciones:** la carpeta `Application/Validators` está vacía (no usa FluentValidation); las validaciones viven dentro de los servicios.

**CORS:** política `LeadFlowFrontendPolicy` que permite orígenes desde `appsettings` (`localhost:3000/5173/4200`, http y https) con cualquier header y método.

**Conexión a BD / Config:** `ConnectionStrings:DefaultConnection`, `JwtSettings:SecretKey` y demás secretos están **vacíos en `appsettings.json`** (se resuelven vía User Secrets — `UserSecretsId` presente en el `.csproj`). Sin migraciones EF; se usa un script SQL manual (`Docs/SQL-Create-AiChatLogs.sql`).

---

## 6. Rutas frontend detectadas

Router activo = TanStack (`tanstackRouter.tsx`). Árbol real definido:

| Ruta | Componente | Layout | Estado |
|---|---|---|---|
| `/` | LandingPage | PublicLayout | ✅ Implementada |
| `/login` | LoginPage | PublicLayout | ✅ Implementada (conectada) |
| `/register` | RegisterPage | PublicLayout | ✅ Implementada (conectada) |
| `/app` | DashboardPage | AppLayout (guard) | ✅ Implementada (mock) |

**Rutas que el menú lateral enlaza pero que NO existen en el router:** `/app/customers`, `/app/leads`, `/app/tasks`, `/app/quotes`, `/app/reports`, `/app/ai`, `/app/settings`. Hacer clic en ellas no renderiza nada (ver sección 12, problema crítico). El `AppRouter.tsx` (react-router-dom) define rutas distintas pero **no se usa**.

---

## 7. Endpoints backend detectados

Extraídos de los atributos de ruta de los 19 controladores. Todos bajo `[Authorize]` salvo los marcados como públicos.

**Auth** (`/api/auth`, público + rate limit): `POST register-company`, `POST login`, `POST change-password` *(auth)*, `POST forgot-password`, `POST reset-password`, `POST refresh-token`, `POST logout`.

**Current User** (`/api/current-user`): `GET`.

**Customers** (`/api/customers`): `GET` (paginado), `GET {id}`, `POST`, `PUT {id}`, `DELETE {id}`.

**Leads** (`/api/leads`): `GET`, `GET {id}`, `POST`, `PUT {id}`, `PATCH {id}/status`, `DELETE {id}`.

**Lead Statuses / Pipeline** (`/api/lead-statuses`): `GET`, `GET {id}`, `POST`, `PUT {id}`, `DELETE {id}`.

**Interactions** (`/api/interactions`): `GET`, `GET {id}`, `GET customer/{customerId}`, `GET lead/{leadId}`, `POST`, `PUT {id}`, `DELETE {id}`.

**Tasks** (`/api/tasks`): `GET`, `GET overdue`, `GET {id}`, `POST`, `PUT {id}`, `PATCH {id}/status`, `DELETE {id}`.

**Services** (`/api/services`): `GET`, `GET {id}`, `POST`, `PUT {id}`, `DELETE {id}`.

**Quotes** (`/api/quotes`): `GET`, `GET {id}`, `GET {id}/pdf`, `POST {id}/send-email`, `POST`, `PUT {id}`, `PATCH {id}/status`, `DELETE {id}`.

**Users** (`/api/users`): `GET` *(Admin/Gerente)*, `GET {id}` *(Admin/Gerente)*, `POST` *(Admin)*, `PUT {id}` *(Admin)*, `PATCH {id}/status` *(Admin)*.

**Dashboard** (`/api/dashboard`): `GET summary`.

**Reports** (`/api/reports`, *Admin/Gerente*): `GET sales`, `GET pipeline`, `GET productivity`, `GET customers` (con `?from=&to=`).

**Company Settings** (`/api/company-settings`): `GET`, `PUT` *(Admin)*.

**Alerts** (`/api/alerts`): `GET`.

**Audit Logs** (`/api/audit-logs`, *Admin/Gerente*): `GET` (filtros `from`, `to`, `entityName`, `action`).

**Onboarding** (`/api/onboarding`): `GET status`.

**AI** (`/api/ai`): `GET context`, `POST chat`, `GET history`.

**Health / DatabaseTest**: `GET /api/health`, `GET /api/database-test/companies` *(Admin)* — utilitarios.

> Contrato de paginación (de la guía del backend): respuesta `{ items, page, pageSize, totalItems, totalPages, hasPreviousPage, hasNextPage }`, parámetros `?Page=1&PageSize=10`.

---

## 8. Módulos CRM existentes

**En backend (listos para consumir):** todos. Auth, Current User, Onboarding, Company Settings, Customers, Leads, Lead Statuses (pipeline), Interactions, Tasks, Services, Quotes (+ PDF + email simulado), Users, Dashboard, Reports, Alerts, Audit Logs, AI (chat simulado + contexto + historial).

**En frontend (UI construida):**
- Landing (completa, con animaciones).
- Login y Registro (completos y **conectados** al backend).
- Dashboard ejecutivo (UI completa: métricas, gráfico de ingresos, tarjeta de IA, pipeline, feed de actividad, tareas, alertas, tabla de cotizaciones) — pero **alimentado con mock**.

---

## 9. Módulos CRM faltantes o no encontrados (en frontend)

No existe UI todavía para: **Clientes, Leads/Pipeline kanban, Detalle de lead, Tareas, Interacciones, Servicios, Cotizaciones (+ vista PDF), Reportes, Alertas, Asistente IA, Usuarios y roles, Configuración de empresa, Auditoría, Onboarding/checklist, y Recuperación de contraseña (forgot/reset)**. Todos estos tienen endpoint backend listo; solo falta la pantalla. El menú lateral ya reserva el espacio de navegación para varios de ellos, pero sin ruta ni página.

---

## 10. Qué partes del frontend ya están conectadas al backend

Solo **autenticación**:
- `features/auth/authService.ts` → `POST /auth/login`, `POST /auth/register-company`, `GET /current-user`.
- `AuthProvider` restaura sesión al cargar (`/current-user`), guarda tokens y expone `login`/`register`/`logout`.
- `httpClient` (axios) inyecta `Authorization: Bearer` automáticamente.
- `LoginPage`/`RegisterPage` llaman a estos servicios y navegan a `/app`.

Los tipos de `auth.types.ts` están **alineados** con los DTOs reales (`RegisterRequest` ↔ `RegisterCompanyRequest`, `AuthResponse` ↔ `AuthResponse`). Bien hecho.

---

## 11. Qué partes usan datos mock

Todo el **dashboard**. Los 8 componentes (`MetricsGrid`, `RevenueChart`, `AIInsightCard`, `PipelineSnapshot`, `ActivityFeed`, `TasksList`, `AlertsPanel`, `QuotesTable`) importan desde `features/dashboard/data/mock.ts`. **Ningún** componente del dashboard consume `/api/dashboard/summary` ni los demás endpoints. La landing también usa datos ilustrativos en `ReportsSection`.

---

## 12. Problemas técnicos encontrados (priorizados)

**🔴 Críticos**

1. **Doble sistema de routing.** Conviven `@tanstack/react-router` (activo, en `App.tsx`) y `react-router-dom` (en `AppRouter.tsx`, que no se importa en ningún sitio). Es código muerto + dependencia pesada innecesaria; genera confusión sobre cuál es la fuente de verdad de las rutas.
2. **Enlaces de navegación rotos.** El sidebar de `AppLayout` apunta a `/app/customers`, `/app/leads`, `/app/tasks`, `/app/quotes`, `/app/reports`, `/app/ai`, `/app/settings`, pero el `routeTree` solo define `/app`. Al hacer clic, la app no renderiza la pantalla (rutas inexistentes). La app "se siente rota" para cualquiera que explore el menú.
3. **`baseURL` hardcoded sin variable de entorno.** `httpClient` usa `https://localhost:7078/api` fijo. No hay archivos `.env`. Cambiar de entorno (dev/staging/prod) exige editar código, y el certificado https local de Kestrel puede provocar fallos de fetch/CORS en desarrollo.

**🟠 Importantes**

4. **Sin manejo de expiración de sesión.** El interceptor de axios solo agrega el token en la *request*; no hay interceptor de *response* que capture `401` y rote con `POST /auth/refresh-token`. Existe `getRefreshToken()` pero nunca se usa. Cuando el token expire (120 min), el usuario será expulsado sin renovación automática.
5. **`logout` no avisa al backend.** `AuthProvider.logout` solo limpia localStorage; no llama a `POST /auth/logout`, por lo que el refresh token sigue válido en BD hasta expirar.
6. **`fullName` se pierde al recargar.** En login, `AuthResponse` trae `fullName` y se muestra en el saludo/iniciales. Pero al restaurar sesión, `GET /current-user` (`CurrentUserResponse`) **no incluye** `fullName`, así que tras un refresh de página el dashboard cae al fallback (prefijo del email). Inconsistencia visible.
7. **Tokens en `localStorage`.** Práctica común pero con exposición a XSS (descriptivo, no bloqueante).

**🟡 Menores / higiene**

8. **Dos lockfiles** (`package-lock.json` + `pnpm-lock.yaml`): el proyecto declara pnpm pero arrastra el de npm. Riesgo de resoluciones divergentes.
9. **Sin alias de imports.** `tsconfig.app.json` no define `paths` (`@/...`); hay imports relativos profundos (`../../../`). Afecta mantenibilidad a medida que crezca.
10. **`react-hook-form` y `zod` instalados pero sin uso real.** `LoginPage` valida con `useState` manual. No hay un patrón de formularios/validación estandarizado todavía.
11. **No hay capa de tipos compartida con los DTOs del backend** más allá de auth. Cada módulo nuevo necesitará sus tipos; conviene definirlos desde ya alineados a los Response del backend.
12. **Versiones muy "de punta"** (React 19, Vite 8, TS 6, Tailwind 4, ESLint 10). Es válido, pero aumenta el riesgo de incompatibilidades entre plugins; conviene fijar el build.

---

## 13. Problemas visuales o de UX encontrados

- **Botones sin acción:** en el header del dashboard "Nueva cotización" y "+ Nuevo lead" no hacen nada; el botón de campana (Notificaciones) en el topbar es decorativo.
- **Navegación que no lleva a ningún lado** (mismo origen que el problema técnico #2): mala primera impresión al explorar el menú.
- **Datos mock inconsistentes con la realidad futura:** las métricas, montos y nombres son ilustrativos; al conectar datos reales pueden cambiar formatos (moneda CRC, fechas) y romper supuestos visuales.
- **Saludo con nombre inestable** tras recargar (problema #6) — afecta la sensación premium.
- **Estados vacíos / carga / error no diseñados** para listados aún inexistentes (cuando se conecten clientes/leads habrá que cubrir empty states y skeletons).

> Aspectos positivos de UX: la landing y el dashboard tienen un nivel visual alto, jerarquía clara, animaciones con propósito y un sistema de color teal coherente con `PRODUCT.md`.

---

## 14. Riesgos actuales del proyecto

1. **Divergencia mock ↔ DTOs reales.** Como el dashboard se diseñó contra `mock.ts` y no contra `/api/dashboard/summary`, la forma de los datos reales puede no coincidir; la conexión obligará a remodelar componentes si no se alinea pronto a los Response del backend.
2. **Router duplicado** puede causar confusión en el equipo y, si alguien importa el router equivocado, romper la navegación o el build.
3. **Navegación rota** transmite producto inacabado y bloquea pruebas de flujo end-to-end.
4. **Sesión frágil** (sin refresh ni manejo de 401): experiencia de "me sacó la sesión" en demos largas.
5. **Configuración por código (sin `.env`)**: fricción para desplegar y para que otra persona levante el proyecto contra otra URL de API.
6. **Cobertura de pruebas inexistente** en frontend: cada integración nueva es manual.

---

## 15. Buenas prácticas que ya se están usando

**Frontend**
- Arquitectura **feature-based** clara (`app/`, `features/`, `shared/`).
- **Lazy loading** de rutas con `lazyRouteComponent` (mejor bundle inicial).
- **Cliente HTTP centralizado** con interceptor de token (un solo punto de cambio).
- **AuthProvider** con restauración de sesión, estado de carga y contexto tipado.
- **Guard de sesión** real en `AppLayout` (spinner mientras valida, redirect a `/login` si no hay sesión).
- **Tipos alineados** con los DTOs del backend en auth.
- **Accesibilidad base**: `aria-label`, `role="list"`, foco en navegación, drawer móvil accesible.
- **Responsive** correcto (sidebar fijo desktop + drawer móvil con overlay).
- **Manejo de error de login** parseando el `message` del backend.
- **Documentación de producto** (`PRODUCT.md`) con principios y anti-referencias, y skills de diseño instaladas.

**Backend** (descriptivo)
- Clean Architecture con separación estricta de capas y DI explícita por módulo.
- Seguridad madura: JWT + refresh hasheado, rate limiting, bloqueo por intentos, multiempresa por `CompanyId`, CORS por orígenes, middleware global de errores, auditoría.
- Documentación interna excelente (`Backend-Estado-Actual.md`, `Backend-Guia-Frontend.md`) con contratos, ejemplos JSON y usuarios de prueba.

---

## 16. Recomendaciones de mejora (solo frontend e integración)

> Ninguna de estas toca el backend. Son cambios de frontend o de la capa de integración que lo consume.

1. **Elegir un solo router.** Mantener TanStack Router (ya es el activo) y eliminar la dependencia/uso de `react-router-dom` + `AppRouter.tsx`. *(Solo tras tu aprobación; no lo hago en esta fase.)*
2. **Definir las rutas del menú** que hoy enlazan a la nada, aunque sea con páginas placeholder, para que la navegación no se sienta rota.
3. **Mover la URL de la API a `.env`** (`VITE_API_URL`) y leerla en `httpClient`. Permite dev/staging/prod sin tocar código.
4. **Añadir interceptor de respuesta 401** en axios para rotar con `/auth/refresh-token` y, si falla, hacer logout limpio. Usar el `getRefreshToken()` ya existente. Hacer que `logout` llame a `/auth/logout`.
5. **Crear una capa de servicios y tipos por módulo** (`features/<x>/<x>Service.ts` + tipos alineados a los Response del backend), siguiendo el patrón que ya funciona en `auth`.
6. **Estandarizar formularios con react-hook-form + zod** (ya instalados) para validación consistente y accesible.
7. **Reemplazar mocks del dashboard por `/api/dashboard/summary`**, dejando el `mock.ts` solo como fallback/diseño.
8. **Diseñar estados de carga, vacío y error** reutilizables (skeletons, empty states) antes de conectar listados.
9. **Añadir alias `@/` en tsconfig + Vite** para imports limpios.
10. **Unificar a un solo gestor de paquetes** (pnpm) y eliminar el lockfile sobrante.
11. **Guardas por rol en frontend** para módulos restringidos (Reportes, Usuarios, Auditoría son Admin/Gerente; CRUD de Users es Admin) reflejando lo que el backend ya exige.

---

## 17. Orden recomendado para seguir desarrollando

El backend ya está listo en todos los módulos, así que el orden óptimo prioriza (a) estabilidad de base, (b) valor de uso diario, (c) complejidad creciente:

1. Estabilizar arquitectura de routing, `.env` y sesión (base sólida).
2. Autenticación real "completa" (refresh, logout backend, recuperación de contraseña, guardas por rol).
3. Dashboard conectado (primer dato real de extremo a extremo).
4. Clientes (CRUD base, patrón de tablas/formularios reutilizable).
5. Leads + Pipeline (kanban) — corazón del CRM.
6. Tareas + Interacciones (operación diaria del vendedor).
7. Servicios + Cotizaciones (+ vista PDF).
8. Reportes.
9. Usuarios + Configuración de empresa + Auditoría (administración).
10. IA + Alertas inteligentes.

---

## 18. Primer siguiente paso recomendado

**Fase 1 (abajo): estabilizar routing, configuración y sesión** — es el cimiento. Concretamente, el primer paso atómico sería: **unificar el router en TanStack, definir páginas placeholder para las rutas del menú, y mover `baseURL` a `VITE_API_URL`.** Esto elimina los 3 problemas críticos de la sección 12 y deja la app navegable y configurable antes de conectar cualquier módulo.

*(No ejecuto nada hasta que apruebes la fase.)*

---

# Plan de trabajo por fases

> Reglas que respeta este plan: no crear ni modificar endpoints del backend; el backend solo se consume. Todo cambio es en `Frontend/LeadFlow.Frontend`. Avanzamos solo cuando tú indiques la fase.

### Fase 1 — Estabilizar arquitectura, build y configuración
- **Archivos frontend:** `app/routes/tanstackRouter.tsx`, `App.tsx`, `app/routes/AppRouter.tsx` (retirar), `shared/api/httpClient.ts`, nuevo `.env` / `.env.example`, `package.json`/lockfiles.
- **Endpoints backend:** ninguno nuevo (solo se prepara el cliente).
- **Componentes a crear:** páginas placeholder para `/app/customers`, `/app/leads`, `/app/tasks`, `/app/quotes`, `/app/reports`, `/app/ai`, `/app/settings`; opcional `RouteError`/`NotFound`.
- **Riesgos:** quitar `react-router-dom` podría afectar algo si estuviera importado en otro lado (verificado: solo `AppRouter.tsx` lo usa); cambiar `baseURL` exige cert https local válido o usar http.
- **Resultado visible:** menú lateral 100% navegable (aunque con pantallas "en construcción"), un solo router, API configurable por entorno.

### Fase 2 — Autenticación real completa
- **Archivos:** `AuthProvider.tsx`, `httpClient.ts` (interceptor 401), `authService.ts`, `authStorage.ts`, nuevas `ForgotPasswordPage`/`ResetPasswordPage`, guarda por rol reutilizable.
- **Endpoints consumidos (existentes):** `POST /auth/login`, `POST /auth/register-company`, `GET /current-user`, `POST /auth/refresh-token`, `POST /auth/logout`, `POST /auth/forgot-password`, `POST /auth/reset-password`.
- **Componentes a crear:** formulario de recuperación/reset, `<RequireRole>` wrapper, manejo de expiración transparente.
- **Riesgos:** bucles de refresh si se maneja mal el 401; `fullName` no viene en `/current-user` (decidir cómo persistirlo en frontend sin tocar backend).
- **Resultado visible:** sesión que se renueva sola, logout real, recuperación de contraseña funcional, rutas admin protegidas.

### Fase 3 — Dashboard conectado
- **Archivos:** `features/dashboard/DashboardPage.tsx`, los 8 componentes, nuevo `dashboardService.ts` + tipos, `data/mock.ts` (degradado a fallback).
- **Endpoints consumidos:** `GET /dashboard/summary` (y opcional `GET /alerts`, `GET /tasks/overdue`, `GET /ai/context` para tarjetas).
- **Componentes a crear:** skeletons/empty/error states reutilizables.
- **Riesgos:** desajuste entre forma del mock y la del `DashboardResponse` real → posible remodelado de componentes.
- **Resultado visible:** dashboard con datos reales de la empresa logueada.

### Fase 4 — Clientes
- **Archivos:** nuevo `features/customers/` (lista, detalle, formulario), `customersService.ts` + tipos, rutas en `tanstackRouter.tsx`.
- **Endpoints consumidos:** `GET /customers` (paginado), `GET /customers/{id}`, `POST`, `PUT /{id}`, `DELETE /{id}`.
- **Componentes a crear:** `DataTable` reutilizable, paginación, formulario con react-hook-form + zod, modal/confirm de borrado.
- **Riesgos:** definir bien el patrón de tabla/paginación aquí, porque se reutilizará en todos los módulos siguientes.
- **Resultado visible:** CRUD de clientes funcional con datos reales.

### Fase 5 — Leads y Pipeline
- **Archivos:** `features/leads/` (lista, kanban, detalle), `features/pipeline/` o lead-statuses, servicios + tipos.
- **Endpoints consumidos:** `GET/POST/PUT/DELETE /leads`, `PATCH /leads/{id}/status`, `GET /lead-statuses` (+ CRUD para configurar pipeline).
- **Componentes a crear:** tablero **kanban** por estado con drag-and-drop (cambio de estado vía `PATCH`), tarjeta de lead, detalle de lead.
- **Riesgos:** el backend valida que el estado exista y esté activo para la empresa; manejar reglas de "ganado/perdido"; complejidad del drag-and-drop.
- **Resultado visible:** pipeline visual operativo, mover leads entre etapas.

### Fase 6 — Tareas e Interacciones
- **Archivos:** `features/tasks/`, `features/interactions/` (a menudo embebidas en el detalle de lead/cliente), servicios + tipos.
- **Endpoints consumidos:** `GET/POST/PUT/DELETE /tasks`, `GET /tasks/overdue`, `PATCH /tasks/{id}/status`; `GET/POST/PUT/DELETE /interactions`, `GET /interactions/customer/{id}`, `GET /interactions/lead/{id}`.
- **Componentes a crear:** lista de tareas con estados/prioridad, badge de vencidas, timeline de interacciones reutilizable en detalle de cliente y lead.
- **Riesgos:** alcance por rol/usuario asignado (vendedor solo ve lo suyo) debe reflejarse en la UI.
- **Resultado visible:** seguimiento operativo del día (tareas + historial de contactos).

### Fase 7 — Servicios y Cotizaciones
- **Archivos:** `features/services/`, `features/quotes/` (lista, editor con items, vista PDF), servicios + tipos.
- **Endpoints consumidos:** `GET/POST/PUT/DELETE /services`; `GET/POST/PUT/DELETE /quotes`, `PATCH /quotes/{id}/status`, `GET /quotes/{id}/pdf`, `POST /quotes/{id}/send-email`.
- **Componentes a crear:** editor de cotización con líneas de ítems, cálculo en vivo de subtotal/descuento/IVA/total, visor de PDF, selector de servicios del catálogo.
- **Riesgos:** replicar los cálculos visuales de forma coherente con los del backend (IVA 13% CR, moneda); manejo de descarga de PDF (blob).
- **Resultado visible:** crear/enviar/descargar cotizaciones reales.

### Fase 8 — Reportes
- **Archivos:** `features/reports/`, servicios + tipos.
- **Endpoints consumidos (Admin/Gerente):** `GET /reports/sales`, `/pipeline`, `/productivity`, `/customers` con `?from=&to=`.
- **Componentes a crear:** selector de rango de fechas, gráficos con recharts (ya instalado), tablas de resumen, exportación opcional.
- **Riesgos:** estos endpoints exigen rol Admin/Gerente; la UI debe ocultarse/protegerse para vendedores.
- **Resultado visible:** reportes gerenciales con datos reales y filtros por fecha.

### Fase 9 — Usuarios, Configuración y Auditoría
- **Archivos:** `features/users/`, `features/settings/`, `features/audit/`, servicios + tipos.
- **Endpoints consumidos:** `GET /users` (Admin/Gerente), `POST/PUT/PATCH status` (Admin); `GET/PUT /company-settings` (PUT = Admin); `GET /audit-logs` (Admin/Gerente, con filtros); `GET /onboarding/status`.
- **Componentes a crear:** gestión de usuarios y roles, formulario de configuración de empresa (moneda, IVA, prefijo, términos), tabla de auditoría con filtros, checklist de onboarding.
- **Riesgos:** aplicar correctamente las guardas por rol; el onboarding calcula avance real → la UI debe reflejar el siguiente paso.
- **Resultado visible:** administración completa de la empresa y trazabilidad.

### Fase 10 — IA y Alertas inteligentes
- **Archivos:** `features/ai/`, `features/alerts/` (o panel global), servicios + tipos.
- **Endpoints consumidos:** `GET /ai/context`, `POST /ai/chat`, `GET /ai/history`; `GET /alerts`.
- **Componentes a crear:** asistente IA (chat lateral o página) con `answer`/`recommendations`/`relatedEntities`, historial; panel/campana de alertas conectado (hoy el botón de campana es decorativo).
- **Riesgos:** la IA del backend es **simulada** hoy (`isSimulated: true`); la UI debe comunicarlo con honestidad y estar lista para el proveedor real futuro sin cambiar el contrato.
- **Resultado visible:** asistente comercial y alertas reales (tareas vencidas, cotizaciones por vencer, leads calientes).

---

*Fin del diagnóstico. No se ha modificado código de frontend ni backend. Espera tu indicación de qué fase trabajar.*
