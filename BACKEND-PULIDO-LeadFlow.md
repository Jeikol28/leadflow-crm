# LeadFlow — Pulido de Backend para llegar a "producción"

> Lista de trabajo pendiente del backend (.NET 8 / Clean Architecture) para dejar la app
> 100% funcional, segura y lista para desplegar. El frontend ya está completo y consume
> estos endpoints; varios puntos de abajo son "stubs" o simulaciones que hay que volver reales.
>
> Marcá cada ítem al completarlo. Prioridad: 🔴 crítico · 🟠 importante · 🟢 deseable.

---

## 1. Asistente IA — pasar de simulado a real

Hoy `/ai/chat` devuelve una respuesta simulada (`isSimulated: true`). Para que sea un copiloto real:

- 🟠 Integrar un proveedor real (Claude / OpenAI / Azure OpenAI) detrás de la misma interfaz, sin cambiar el contrato del endpoint.
- 🔴 Guardar la API key del proveedor en **secret manager / variables de entorno**, nunca en `appsettings.json` versionado.
- 🟠 Construir el *contexto* con datos reales de la empresa (leads abiertos, tareas vencidas, cotizaciones) y pasarlo como contexto del prompt — respetando el `companyId` del usuario (no filtrar datos de otras empresas).
- 🟠 Límite de uso / *rate limit* por empresa o usuario para controlar costos.
- 🟢 Streaming de respuesta (SSE) para que el chat escriba en vivo en vez de esperar el bloque completo.
- 🟢 Mantener `isSimulated` como bandera para poder degradar a modo simulado si el proveedor falla.
- 🟢 Registrar tokens consumidos / costo por consulta para auditoría.

## 2. Correo SMTP — envío real

Hoy el envío de cotización por correo es un stub. Para que mande correos de verdad:

- 🔴 Configurar un proveedor SMTP real (SendGrid, Amazon SES, Mailgun, o SMTP corporativo) con credenciales en variables de entorno.
- 🟠 Plantilla de correo HTML para la cotización (con logo de empresa, datos del cliente, PDF adjunto).
- 🟠 Adjuntar el PDF de la cotización generado en el backend (no depender del front).
- 🟠 Manejo de errores y reintentos: si el SMTP falla, no romper la request — encolar o devolver estado claro.
- 🟢 Cola/*background job* (Hangfire / hosted service) para no bloquear el request mientras se envía.
- 🟢 Registro de correos enviados (a quién, cuándo, estado) para la bitácora.
- 🟢 Verificación de dominio/SPF/DKIM para que no caiga en spam.

## 3. Seguridad — endurecimiento

### 3.1 Tokens y sesión
- 🔴 Mover los tokens de `localStorage` (front) a **cookies httpOnly + Secure + SameSite**, para mitigar XSS robando el token. *(Requiere cambio coordinado front+back: endpoints que setean/leen cookie.)*
- 🔴 **Rotación de refresh tokens**: cada uso emite uno nuevo e invalida el anterior; detección de reuso (token robado → revocar familia).
- 🟠 Endpoint de **revocación** real en logout (invalidar el refresh token en BD, no solo borrarlo en el cliente).
- 🟠 Expiración corta del access token (5–15 min) + refresh más largo.
- 🟠 `verify-password` / **step-up auth**: pedir contraseña de nuevo para acciones sensibles (cambiar rol, desactivar usuarios, borrar datos).

### 3.2 Cabeceras y transporte
- 🔴 Forzar **HTTPS** (HSTS) en producción.
- 🟠 **CSP** (Content-Security-Policy) y cabeceras de seguridad: `X-Content-Type-Options`, `X-Frame-Options`/frame-ancestors, `Referrer-Policy`.
- 🟠 **CORS** restringido a los orígenes reales de producción (no `*`, no `localhost`).

### 3.3 Abuso y credenciales
- 🟠 **Rate limiting** global y específico en `/auth/login` (anti fuerza bruta) y en `/ai/chat`.
- 🟠 **Bloqueo por intentos fallidos** de login (lockout temporal).
- 🟠 Política de contraseñas (longitud/complejidad) validada en el backend, no solo en el front.
- 🟢 Hash de contraseñas con algoritmo fuerte y *work factor* adecuado (verificar que sea bcrypt/Argon2/PBKDF2 con iteraciones suficientes).
- 🟢 Considerar 2FA (TOTP) para administradores.

### 3.4 Multiempresa (multi-tenant)
- 🔴 **Aislamiento por `companyId` garantizado en TODOS los endpoints y queries** (que un usuario nunca pueda leer/editar datos de otra empresa, ni manipulando IDs). Auditar cada repositorio/handler.
- 🟠 Autorización por rol verificada en el backend en cada acción (no confiar en que el front oculte botones): `AdminEmpresa`, `Gerente`, `Vendedor`, `Soporte`.

## 4. Reglas de negocio de usuarios

- 🔴 **Proteger al último administrador**: no permitir desactivar/eliminar/cambiar de rol al último `AdminEmpresa` activo de la empresa.
- 🔴 **Auto-bloqueo**: un usuario no puede desactivarse ni quitarse su propio rol de admin a sí mismo.
- 🟠 Validar correo único por empresa al crear/editar usuario (mensaje claro si está repetido).
- 🟠 Flujo de invitación / set de contraseña inicial (en vez de crear con contraseña en texto).
- 🟢 Reset de contraseña por correo (depende del SMTP del punto 2).

## 5. Búsqueda, filtros y paginación server-side

Hoy el buscador del front solo filtra la página ya cargada.

- 🟠 **Búsqueda y filtros server-side** en los listados (clientes, leads, tareas, cotizaciones): parámetro `search` + filtros por estado/fecha que filtren en la BD, no en memoria.
- 🟠 Endpoints "por lead": tareas y cotizaciones **filtradas por `leadId`** (hoy el detalle de lead las filtra en el cliente).
- 🟢 Orden configurable (`sortBy`, `sortDir`) en los listados.
- 🟢 Tope máximo de `PageSize` para evitar consultas gigantes.

## 6. KPIs con tendencia (dashboard)

El front muestra "—" en los chips de tendencia porque el backend no devuelve comparación.

- 🟠 En `GET /dashboard/summary`, agregar valores del **período anterior** (mes/semana previa) para cada KPI, para poder mostrar "+12% vs período anterior".
- 🟢 Parámetro de rango de fechas para el dashboard.

## 7. Base de datos / EF Core

- 🔴 **Migraciones EF** versionadas y aplicadas en el pipeline de despliegue (no `EnsureCreated`).
- 🟠 **Índices** en columnas de filtro/join frecuentes (`companyId`, `status`, fechas, FKs) para rendimiento.
- 🟠 Revisar **N+1 queries** y usar proyecciones (`Select` a DTO) en listados.
- 🟢 Seed de datos de demo controlado por entorno (no en producción).
- 🟢 Estrategia de borrado: confirmar si es *soft delete* (campo `isActive`/`deletedAt`) o físico, y que sea consistente.

## 8. Validación y manejo de errores

- 🟠 Respuestas de error consistentes (**ProblemDetails** / formato uniforme) para que el front muestre mensajes claros.
- 🟠 Validación de entrada centralizada (FluentValidation o data annotations) en todos los comandos/DTOs.
- 🟢 No filtrar *stack traces* ni detalles internos en producción.

## 9. Observabilidad y operación

- 🟠 **Logging estructurado** (Serilog) con `companyId`/`userId`/`requestId` para trazar acciones.
- 🟠 **Health checks** (`/health`) para BD y dependencias (SMTP, proveedor IA).
- 🟠 **Monitoreo de errores** en producción (Sentry o Application Insights).
- 🟢 Métricas básicas (latencia, throughput) y alertas.

## 10. Pruebas del backend

- 🟠 **Pruebas unitarias** de la capa Application (handlers, validaciones, reglas de negocio como "último admin").
- 🟠 **Pruebas de integración** sobre los endpoints críticos (auth, crear lead, crear cotización, aislamiento multi-tenant) con BD en memoria o contenedor.
- 🟢 Incluirlas en el pipeline CI junto con las del frontend.

## 11. Despliegue y configuración

- 🔴 **Secretos fuera del repo**: connection string, JWT signing key, API keys (IA, SMTP) en variables de entorno / secret manager.
- 🟠 Configuración por entorno (`Development`/`Staging`/`Production`) y `appsettings` sin secretos.
- 🟠 Pipeline de despliegue (build → test → migraciones → deploy).
- 🟢 Contenedor (Docker) y/o configuración de hosting definida.
- 🟢 Backups automáticos de la base de datos.

---

## Orden recomendado

1. **Seguridad crítica (🔴 del punto 3 y 4)** — aislamiento multi-tenant, último admin, auto-bloqueo, HTTPS, secretos fuera del repo. Es lo que no puede faltar antes de exponer la app.
2. **Cookies httpOnly + rotación de refresh tokens** (coordinado front+back).
3. **SMTP real (#2)** y **migraciones/índices EF (#7)** — funcionalidad y datos sólidos.
4. **Búsqueda/filtros server-side (#5)** y **KPIs con tendencia (#6)** — completan la experiencia.
5. **IA real (#1)** cuando se quiera activar el copiloto de verdad.
6. **Observabilidad (#9)** y **pruebas (#10)** — para operar con confianza.
