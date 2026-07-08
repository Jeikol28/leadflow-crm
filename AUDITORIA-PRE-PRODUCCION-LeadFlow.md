# Auditoría Pre-Producción — LeadFlow CR

**Fecha:** 7 de julio de 2026
**Alcance:** Backend (.NET, Clean Architecture) + Frontend (React 19 / Vite / TanStack)
**Rol del análisis:** QA tester + desarrollador senior + auditoría básica de seguridad

> **Nota importante sobre las pruebas de ejecución.** El entorno de análisis es un sandbox Linux sin el SDK de .NET instalado y con acceso restringido al registro de npm. Por eso **no fue posible compilar el backend (`dotnet build`) ni completar el build del frontend (`npm run build`) dentro del sandbox**. Todo lo demás — revisión de código línea por línea, arquitectura, seguridad, rutas, validaciones, flujos y configuración — se hizo de forma directa sobre el código real. Donde no pude ejecutar algo, lo indico explícitamente y te doy el comando exacto para correrlo tú en tu máquina y qué esperar. Ninguna conclusión de este informe está inventada: cada hallazgo apunta a un archivo real.

---

## A. Resumen general del estado del proyecto

LeadFlow es un **CRM SaaS multiempresa** bien construido. La calidad de ingeniería está **por encima del promedio** para un proyecto en etapa de "listo para hostear": arquitectura limpia por capas en el backend, separación por features en el frontend, autenticación JWT sólida, multi-tenant correctamente aislado en el servidor, rate limiting, verificación de correo, refresh tokens rotativos y una capa de errores uniforme.

**Veredicto:** el sistema está **cerca de producción**, no lejos. No encontré bugs críticos de seguridad ni agujeros de autorización. Los bloqueantes reales son de **configuración e infraestructura de despliegue** (secretos, esquema de base de datos, HTTPS/HSTS, CORS de producción), no de lógica. Con la lista de la sección I resuelta, es un sistema hosteable y presentable.

Qué hace el sistema hoy: gestiona clientes, leads con pipeline personalizable (Kanban), interacciones, tareas, servicios/catálogo, cotizaciones (con PDF y envío por correo), reportes gerenciales (ventas, pipeline, productividad, clientes), dashboard con métricas y alertas inteligentes, usuarios y roles por empresa, configuración de empresa, auditoría (audit logs) y un asistente de IA (Groq). El flujo principal es claro: registro de empresa → verificación de correo → login → dashboard → módulos operativos. Backend y frontend están **bien conectados** mediante una capa de servicios tipada por feature, un `httpClient` central con inyección automática de JWT y renovación de sesión transparente ante 401.

---

## B. Funcionalidades que SÍ están completas

Verificado por lectura directa del código (controladores, servicios, páginas y hooks presentes y coherentes entre sí):

- **Autenticación completa:** registro de empresa + admin, login, logout (revoca refresh token), verificación de correo por código de 6 dígitos, reenvío de código, olvido/reset de contraseña, cambio de contraseña, refresh token rotativo.
- **Multi-tenant (multiempresa):** cada consulta filtra por `CompanyId` tomado del token JWT, no de un parámetro del cliente. Verificado en `CustomerService` (líneas 33, 55, 74, 99, 133) y patrón replicado en los demás servicios.
- **Roles y permisos:** 4 roles (`AdminEmpresa`, `Gerente`, `Vendedor`, `Soporte`). Autorización aplicada en el backend con `[Authorize(Roles=...)]` y reforzada en el frontend con `RequireRole`.
- **Módulos CRUD funcionales:** Customers, Leads (+ estados/pipeline personalizable), Interactions, Tasks, Services, Quotes (con items, PDF y email), Users.
- **Dashboard, Reports (ventas, pipeline, productividad, clientes), Alerts, Onboarding, CompanySettings, AuditLogs, AI Assistant** — todos con controlador + servicio + página + hooks.
- **Manejo de errores uniforme:** contrato `ApiErrorResponse` en 400/401/403/404/429/500, middleware global de excepciones y filtro de validación de modelo.
- **UX de estados:** manejo de `isLoading`/`isPending` (56 archivos), `isError`/`error` (58 archivos) y estados vacíos (25 archivos). No hay `console.log`, `debugger`, `TODO` ni `FIXME` sueltos en el frontend.

---

## C. Funcionalidades incompletas o que requieren atención

Ninguna funcionalidad está "a medias" a nivel de lógica de negocio. Lo que falta es **infraestructura de despliegue**, no features:

1. **Esquema de base de datos sin migraciones (ver Bug #1).** La carpeta `Backend/LeadFlow/LeadFlow.Infrastructure/Migrations/` está **vacía** y no hay llamada a `Migrate()`/`EnsureCreated()`. El esquema se está creando a mano con scripts SQL sueltos. Esto no impide que funcione en tu máquina actual, pero **impide un despliegue reproducible**.
2. **Secretos de configuración vacíos por diseño (ver sección I).** `appsettings.json` trae `ConnectionString`, `JwtSettings:SecretKey`, credenciales de correo y `AiSettings:ApiKey` **en blanco**. En desarrollo se cargan vía *user-secrets* (`UserSecretsId` presente). En producción hay que inyectarlos por variables de entorno; si no, la API **no arranca** (validación en `Program.cs`).
3. **Controlador de prueba `DatabaseTestController`** todavía en el proyecto (protegido a solo-desarrollo, pero conviene eliminarlo).

---

## D. Bugs y hallazgos técnicos encontrados

Ordenados por severidad. Formato: **archivo → problema → por qué → cómo corregir → prioridad.**

**Bug #1 — Sin migraciones de EF Core (esquema no reproducible)** · **ALTA**
`Backend/LeadFlow/LeadFlow.Infrastructure/Migrations/` (vacía); no hay `Database.Migrate()` en `Program.cs`.
*Por qué:* desplegar a una base de datos nueva depende de correr scripts SQL manuales (`verificacion-correo.sql`, `Docs/SQL-Create-AiChatLogs.sql`). No hay una fuente única y versionada del esquema; alto riesgo de *drift* entre tu máquina y producción.
*Cómo corregir:* generar la migración inicial y aplicarla en el pipeline:
```bash
cd Backend/LeadFlow
dotnet ef migrations add InitialCreate -p LeadFlow.Infrastructure -s LeadFlow.Api
dotnet ef database update -p LeadFlow.Infrastructure -s LeadFlow.Api
```
Luego consolidar los `.sql` sueltos dentro de la migración y borrarlos del repo.

**Bug #2 — HSTS no configurado** · **MEDIA**
`Backend/LeadFlow/LeadFlow.Api/Program.cs` — hay `app.UseHttpsRedirection()` pero **no** `app.UseHsts()`.
*Por qué:* sin HSTS el navegador puede intentar la primera conexión por HTTP y quedar expuesto a *downgrade/MITM*.
*Cómo corregir:* en el bloque de producción:
```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
```

**Bug #3 — `AllowedHosts: "*"` en `appsettings.json`** · **MEDIA**
`Backend/LeadFlow/LeadFlow.Api/appsettings.json` (última línea).
*Por qué:* en producción acepta peticiones con cualquier `Host` header (facilita *host header injection*).
*Cómo corregir:* fijar el dominio real en producción, p. ej. `"AllowedHosts": "api.tudominio.com"`.

**Bug #4 — `DatabaseTestController` presente en el build de producción** · **MEDIA**
`Backend/LeadFlow/LeadFlow.Api/Controllers/DatabaseTestController.cs`.
*Por qué:* aunque está bien protegido (`[Authorize(Roles="AdminEmpresa")]` + `if (!IsDevelopment) return NotFound()` + filtro por `CompanyId`), es superficie de ataque innecesaria y "código de prueba" que no debería viajar a producción.
*Cómo corregir:* eliminar el archivo, o envolver todo el controlador en `#if DEBUG ... #endif`.

**Bug #5 — Índice único global sobre `User.Email`** · **MEDIA (decisión de diseño)**
`Backend/LeadFlow/LeadFlow.Infrastructure/Data/LeadFlowDbContext.cs` líneas 82-83 (`HasIndex(u => u.Email).IsUnique()`).
*Por qué:* al ser un CRM multiempresa, este índice **global** impide que un mismo correo exista en dos empresas distintas. Si esperas que una persona pueda pertenecer a varias empresas, esto lo bloquea.
*Cómo corregir:* si el correo debe ser único por empresa, cambiar a índice compuesto `new { u.CompanyId, u.Email }`. Si es intencional (un correo = una empresa), déjalo y documenta la decisión.

**Bug #6 — `Logout` sin `[Authorize]` ni rate limiting** · **BAJA**
`Backend/LeadFlow/LeadFlow.Api/Controllers/AuthController.cs` (endpoint `logout`).
*Por qué:* acepta un refresh token en el body y lo revoca sin exigir sesión. Riesgo bajo (necesitas el token válido), pero permite abuso por fuerza bruta sin límite.
*Cómo corregir:* añadir `[EnableRateLimiting("AuthSensitiveRateLimitPolicy")]` (y opcionalmente `[Authorize]`).

**Bug #7 — Parse frágil de configuración JWT** · **BAJA**
`Backend/LeadFlow/LeadFlow.Infrastructure/ExternalServices/Auth/JwtTokenService.cs` (`int.Parse(jwtSettings["ExpirationMinutes"]!)`).
*Por qué:* si el valor falta o no es numérico, lanza excepción no descriptiva en tiempo de ejecución.
*Cómo corregir:* usar `int.TryParse` con un valor por defecto, o validarlo en `ValidateRequiredConfiguration`.

**Bug #8 — Tipos duplicados entre features** · **BAJA (limpieza)**
Existen `ai.types.ts`, `quotes.types.ts` y `reports.types.ts` duplicados en `features/dashboard/` y en su feature propia (`features/ai/`, `features/quotes/`, `features/reports/`).
*Por qué:* duplicación que puede desincronizarse; huele a copia-pega.
*Cómo corregir:* centralizar cada tipo en su feature dueña y que `dashboard` los importe.

---

## E. Problemas de seguridad encontrados

**Balance general: muy bueno.** Buenas prácticas confirmadas por lectura de código:

- **Contraseñas:** hasheadas con `PasswordHasher<User>` (PBKDF2 de ASP.NET Identity) en `AuthService`. No se guardan en texto plano. ✔
- **No hay secretos quemados:** `appsettings.json` tiene todos los campos sensibles en blanco; los secretos de dev van por *user-secrets* (`UserSecretsId` en el `.csproj`). No hay tokens ni API keys en el frontend. ✔
- **Tokens de un solo uso hasheados:** refresh tokens (64 bytes aleatorios criptográficos) y tokens de reset se guardan como **SHA-256**, nunca en claro; los refresh son **rotativos** y se revoca el anterior. Código de verificación por `RandomNumberGenerator.GetInt32`. ✔
- **Sin SQL Injection:** no hay `FromSqlRaw`/`ExecuteSqlRaw`/concatenación SQL; todo pasa por EF Core parametrizado. ✔
- **Sin sinks de XSS:** no hay `dangerouslySetInnerHTML`, `innerHTML` ni `eval` en el frontend; React escapa por defecto. ✔
- **Autorización en el backend, no solo en el frontend:** cada controlador tiene `[Authorize]`; los sensibles restringen por rol (`Reports`, `AuditLogs` → `AdminEmpresa,Gerente`; `Users`/`CompanySettings` escrituras → `AdminEmpresa`). ✔
- **Errores internos no expuestos:** el middleware devuelve mensaje genérico en 500 y solo loguea el detalle. ✔
- **Fuerza bruta mitigada:** rate limiting (5 login/min por IP, 10/min endpoints sensibles) + bloqueo de cuenta tras N intentos fallidos. ✔
- **CORS restringido a orígenes de config**, con guardas que **impiden arrancar en producción** si hay `localhost` o la lista está vacía (`Program.cs`, `ValidateRequiredConfiguration`). ✔

**Puntos a atender (no críticos):**

1. **Token JWT en `localStorage`** (`shared/utils/authStorage.ts`). Es el patrón común en SPAs, pero es vulnerable a robo si algún día se introduce un XSS. Mitigación actual: no hay XSS. Mejora futura: refresh token en cookie `HttpOnly`+`Secure`+`SameSite`. **Prioridad: media.**
2. **HSTS ausente** (Bug #2) y **`AllowedHosts:"*"`** (Bug #3).
3. **`CorsSettings` con `AllowAnyHeader().AllowAnyMethod()`** — aceptable porque los **orígenes** sí están restringidos, pero podrías acotar métodos/headers si quieres endurecer.

---

## F. Problemas visuales / de experiencia de usuario

No pude renderizar la app en el sandbox (build de npm bloqueado por red), así que esto se basa en lectura de componentes; **debe confirmarse visualmente** corriendo `npm run dev`:

- El proyecto tiene componentes compartidos consistentes: `DataTable`, `Modal`, `Pagination`, `ErrorBoundary`, `ToastProvider`, `ConfirmProvider`, y estados de carga/error/vacío ampliamente presentes. Buena base de UX.
- **Idioma:** revisar consistencia de acentos. Varios mensajes del backend van **sin tildes** intencionalmente (p. ej. "Credenciales invalidas", "La cuenta esta bloqueada", "No autorizado. Inicia sesion nuevamente"), mientras el frontend sí usa tildes. No es un bug, pero se ve inconsistente de cara al usuario. **Prioridad: baja.**
- **Responsive / accesibilidad:** requieren verificación manual en navegador (contraste, `aria-*`, navegación por teclado, foco en modales). En el login sí se usa `aria-hidden` en íconos. Recomiendo una pasada con Lighthouse.
- **Restauración de sesión:** `/current-user` no devuelve el nombre, así que `AuthProvider` lo toma del perfil en `localStorage`. Si alguien limpia storage a mano, el nombre puede aparecer vacío hasta el siguiente login. Detalle menor.

---

## G. Problemas de backend (resumen)

- **Estructura, nombres, rutas e imports:** correctos y consistentes. Clean Architecture bien aplicada (Api → Application → Domain ← Infrastructure). Todos los servicios registrados en DI en `Program.cs`.
- **Controladores/endpoints:** todos con `[Authorize]` salvo `HealthController` (correcto, es health-check anónimo) y los endpoints públicos de `auth`. HTTP status codes correctos.
- **Principales pendientes:** migraciones (Bug #1), HSTS (Bug #2), `AllowedHosts` (Bug #3), quitar `DatabaseTestController` (Bug #4).
- **Swagger:** habilitado **solo en Development** (correcto). Con esquema Bearer configurado para probar endpoints protegidos.
- **Logs:** `ILogger` usado en middleware y `AuthService`; 500 se loguean con stack, 4xx como warning. Adecuado.

---

## H. Problemas de frontend (resumen)

- **Conexión API:** `httpClient` central con base URL desde `import.meta.env.VITE_API_URL`, inyección de Bearer y refresh automático ante 401 con cola de peticiones. Sólido.
- **Protección de rutas:** `AppLayout` (líneas 221-233) muestra loader mientras carga la sesión y redirige a `/login` si no está autenticado; `RequireRole` protege Users/Audit/Reports. Correcto.
- **TypeScript:** `tsconfig.app.json` con `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. ESLint flat config con `typescript-eslint` + react-hooks. Buena configuración. **No pude ejecutar `tsc`/`eslint`** por el bloqueo de npm; hay que correrlos localmente (ver sección J).
- **Limpieza pendiente:** tipos duplicados (Bug #8) y artefactos que no deberían estar en el repo (ver sección I).
- **Versiones de dependencias muy nuevas/futuras:** `typescript ~6.0.2`, `eslint ^10`, `vite ^8`, `react ^19.2`. Confirmá que el lockfile (`pnpm-lock.yaml`) resuelve y que el build pasa en tu entorno; estas versiones pueden traer *breaking changes*.

---

## I. Cosas que debes hacer ANTES de hostear

**Configuración / variables de entorno a crear en el servidor** (la API valida y **no arranca** sin ellas):

| Variable | Dónde | Nota |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | Backend | Cadena real de SQL Server de producción |
| `JwtSettings__SecretKey` | Backend | **≥ 32 caracteres**, aleatoria y secreta (no reutilizar la de dev) |
| `JwtSettings__Issuer` / `JwtSettings__Audience` | Backend | Valores de producción |
| `CorsSettings__AllowedOrigins__0` | Backend | Dominio **real** del frontend, **sin** `localhost` |
| `EmailSettings__SenderEmail` / `Username` / `Password` | Backend | Credenciales SMTP (Brevo) |
| `EmailSettings__AppBaseUrl` | Backend | URL pública del frontend (para links de reset/verificación) |
| `AiSettings__ApiKey` | Backend | API key de Groq |
| `ASPNETCORE_ENVIRONMENT=Production` | Backend | Para activar validaciones y desactivar Swagger |
| `VITE_API_URL` | Frontend | URL pública de la API **con `/api` al final y HTTPS** |

**Quitar del repositorio / no publicar:**
- `Frontend/LeadFlow.Frontend.zip` (1.6 MB), `Frontend/stitch_export/` (280 KB), `Frontend/LeadFlow.Frontend/stitch-reference/` (112 KB) — material de diseño/exportación, peso muerto.
- `Frontend/LeadFlow.Frontend/dist/` (1.3 MB) y `output/` (628 KB) — artefactos de build; deben generarse en CI, no versionarse.
- Scripts SQL sueltos (`verificacion-correo.sql`, `Docs/SQL-Create-AiChatLogs.sql`) una vez migrados a EF.
- `DatabaseTestController.cs`.
- Confirmá que `.env.local`, `appsettings.Development.json` y secretos **no** se suban (el `.gitignore` del frontend cubre `.env*`; verificá que el backend también ignore secretos).

**Base de datos:** generar y aplicar migración inicial (Bug #1); crear el usuario/roles seed si aplica; confirmar los índices únicos; tomar backup y plan de restore.

**Red / dominios:** montar la API detrás de HTTPS (certificado válido), configurar `UseHsts`, fijar `AllowedHosts`, y que `VITE_API_URL` y `CorsSettings:AllowedOrigins` apunten a los dominios reales.

---

## J. Prioridad de cambios

**CRÍTICO (bloquea un despliegue seguro):**
- Definir todos los secretos/variables de producción (sección I). Sin esto la API no arranca.
- HTTPS real + `CorsSettings:AllowedOrigins` con el dominio real (sin localhost).

**ALTO:**
- Bug #1 — Migraciones de EF (esquema reproducible).
- Ejecutar y pasar `dotnet build`, `npm run build`, `tsc -b` y `eslint` en tu entorno (no verificable en el sandbox).
- Sacar artefactos/dist/zip del repo (sección I).

**MEDIO:**
- Bug #2 (HSTS), Bug #3 (`AllowedHosts`), Bug #4 (quitar `DatabaseTestController`), Bug #5 (decidir índice de email).
- Evaluar refresh token en cookie `HttpOnly` en vez de `localStorage`.

**BAJO:**
- Bug #6 (rate limit en logout), Bug #7 (parse JWT robusto), Bug #8 (tipos duplicados), consistencia de tildes en mensajes, pasada de accesibilidad (Lighthouse).

---

## K. Checklist final para producción

```
Configuración
[ ] Secretos inyectados por entorno (connection string, JWT ≥32, SMTP, Groq)
[ ] ASPNETCORE_ENVIRONMENT=Production
[ ] VITE_API_URL apunta a la API pública con HTTPS y /api
[ ] CorsSettings:AllowedOrigins = dominio real del frontend (sin localhost)
[ ] AllowedHosts = dominio real (no "*")

Base de datos
[ ] Migración InitialCreate generada y aplicada
[ ] Scripts SQL sueltos consolidados/eliminados
[ ] Índices únicos revisados (email global vs por empresa)
[ ] Backup + plan de restore

Seguridad
[ ] app.UseHsts() en producción
[ ] JWT SecretKey de producción distinta a la de dev
[ ] DatabaseTestController eliminado
[ ] (Opcional) refresh token en cookie HttpOnly

Build / calidad
[ ] dotnet build sin errores ni warnings relevantes
[ ] npm install && npm run build OK (tsc -b + vite build)
[ ] eslint sin errores
[ ] Swagger deshabilitado en producción (ya es dev-only)

Repo / limpieza
[ ] dist/, output/, *.zip, stitch_* fuera del repo
[ ] .env / appsettings con secretos NO versionados

Pruebas funcionales (correr localmente con estas credenciales)
[ ] Login admin@solucionesticas.cr / Admin1234! OK
[ ] Usuario sin sesión no accede a /app/* (redirige a /login)
[ ] Rol no-admin no ve Users/Audit/Reports (front) y recibe 403 (back)
[ ] CRUD Customers/Leads/Quotes: crear, editar, eliminar
[ ] Filtros/búsquedas y paginación
[ ] Estados vacíos y error de API muestran mensajes amigables
[ ] Token expirado se renueva solo (refresh) y logout revoca
```

---

## L. Recomendaciones finales

1. **Este proyecto está bien hecho.** La base de seguridad y arquitectura es fuerte; lo que queda es *cerrar el despliegue*, no reescribir. Prioriza sección J-Crítico y J-Alto y quedas listo para hostear.
2. **Cierra el ciclo de la base de datos con migraciones** — es el mayor riesgo operativo hoy. Un esquema versionado te evita sorpresas en producción y en el siguiente ambiente.
3. **Corre los builds y linters en tu máquina** antes de subir. Yo no pude por el entorno; te dejé los comandos y qué revisar. Presta atención a las versiones "futuras" de las dependencias.
4. **Haz una pasada visual y de accesibilidad** con `npm run dev` + Lighthouse: responsive, contraste, foco en modales y teclado.
5. **Endurece el transporte:** HTTPS + HSTS + `AllowedHosts` + (idealmente) refresh token en cookie `HttpOnly`.
6. **Automatiza:** un pipeline mínimo (build + test + migraciones + deploy) te evita el 90% de los errores de "subida manual".

### Comandos para ejecutar tú las pruebas técnicas
```bash
# Backend (requiere .NET SDK)
cd "Backend/LeadFlow"
dotnet restore
dotnet build                     # verifica compilación
dotnet ef migrations add InitialCreate -p LeadFlow.Infrastructure -s LeadFlow.Api
dotnet ef database update -p LeadFlow.Infrastructure -s LeadFlow.Api
dotnet run --project LeadFlow.Api   # Swagger en /swagger (solo dev)

# Frontend
cd "Frontend/LeadFlow.Frontend"
pnpm install        # o npm install
pnpm run build      # tsc -b && vite build
pnpm run lint       # eslint
pnpm run dev        # levantar en http://localhost:5173
```
Con la API corriendo, prueba el login vía Swagger o el frontend con `admin@solucionesticas.cr` / `Admin1234!` y recorre el checklist de la sección K.
