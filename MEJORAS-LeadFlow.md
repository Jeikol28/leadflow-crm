# LeadFlow — Qué falta para ser un SaaS profesional (revisión senior)

> Evaluación del estado real del proyecto a la fecha. Marco cada punto con prioridad (🔴 alta / 🟠 media / 🟡 baja) y si es **frontend** (lo controlamos) o **backend** (solo nota, no lo modificamos por ahora).

## Veredicto

El CRM ya está **funcionalmente completo**: todos los módulos del negocio (clientes, leads+pipeline, tareas, interacciones, servicios, cotizaciones con PDF, reportes, usuarios, configuración, auditoría) están conectados a datos reales con una arquitectura limpia (React Query, feature-based, rutas y roles). Eso es mucho. Lo que separa "funciona" de "producto SaaS profesional" no es más funcionalidad: es **calidad de ingeniería, confiabilidad, seguridad de producción y pulido de producto**. Abajo, lo concreto.

---

## 1. Calidad de ingeniería y mantenibilidad

- 🔴 **Sin pruebas automatizadas (frontend).** No hay ni un test. Mínimo profesional: Vitest + React Testing Library para hooks/servicios y componentes críticos, y Playwright para 3-4 flujos clave (login, crear lead, crear cotización, cambiar estado en kanban). Sin tests, cada cambio es un riesgo.
- 🔴 **Código duplicado entre módulos (frontend).** Clientes, Leads, Tareas, Interacciones, Servicios, Cotizaciones, Usuarios repiten casi el mismo patrón de tabla + paginación + modal + confirmación de borrado. Hay que extraer primitivos reutilizables: `<DataTable>`, `<Modal>` (con foco atrapado y cierre con Esc), `<Pagination>`, `<ConfirmButton>`, `<Field>`. Reduciría el código a la mitad y haría que un cambio se aplique en un solo lugar.
- 🟠 **Sin Error Boundary / pantallas de error.** Si un componente lanza un error, hoy se cae toda la app (pantalla blanca). Agregar un `ErrorBoundary` global y `errorComponent` por ruta (TanStack Router lo soporta).
- 🟠 **Validación de formularios inconsistente.** Usamos validación nativa de react-hook-form. Estandarizar con **zod + @hookform/resolvers**: esquemas de validación reutilizables y, idealmente, derivados de los contratos del backend.
- 🟠 **Tipos escritos a mano que pueden desincronizarse del backend.** Cada módulo recrea los DTOs. El backend ya expone **Swagger/OpenAPI**: generar los tipos (y hasta el cliente HTTP) con `openapi-typescript`/NSwag para que el frontend nunca se desfase de la API.
- 🟡 **Limpieza pendiente:** `data/mock.ts` ya solo aporta dos tipos; mover esos tipos y borrar los datos mock. Revisar `lucide-react@1.17.0` (versión sospechosa) y fijar versiones.
- 🟡 **Formato de moneda mezclado** (compacto "CRC 2.2M" vs exacto en cotizaciones). Unificar con `Intl.NumberFormat` y una sola función.

## 2. Experiencia de usuario / producto

- 🔴 **Búsqueda y filtros reales (necesita backend).** Hoy el buscador de las tablas solo filtra las 10 filas ya cargadas de la página actual, porque los endpoints de listado solo aceptan paginación. Un CRM profesional necesita **búsqueda y filtros del lado servidor** (por nombre, estado, fechas, usuario asignado). Requiere agregar parámetros de query en el backend.
- 🔴 **Páginas de detalle por entidad (frontend).** Hoy todo es lista + modal de edición. Falta el **detalle de un lead/cliente** que muestre su línea de tiempo: sus tareas, interacciones y cotizaciones en un solo lugar. El backend ya lo permite (`GET /interactions/lead/{id}`, etc.). Es probablemente la mejora de producto de mayor valor.
- 🟠 **Sistema de notificaciones/toasts unificado.** El feedback de "guardado", "eliminado", "error" es inconsistente (avisos en línea sueltos). Agregar una librería de toasts (p.ej. sonner) y usarla en todas las mutaciones.
- 🟠 **Selector de usuario asignado en Leads y Tareas.** Lo dejamos fuera porque `GET /users` es Admin/Gerente. Para esos roles, agregar el picker (con guardia de rol) para asignar trabajo a otros.
- 🟠 **Página de "Mi perfil".** Bloqueamos la auto-edición en Usuarios (bien), pero falta una pantalla propia para que cada quien edite su nombre y **cambie su contraseña** (`POST /auth/change-password` ya existe).
- 🟠 **Estados vacíos con acción.** Varios vacíos son solo texto; convertirlos en guías ("Aún no hay leads — crea el primero").
- 🟡 **Acciones masivas** (seleccionar varias filas y borrar/asignar en lote).
- 🟡 **Command palette (⌘K)** para crear/buscar rápido — estándar en CRMs modernos.
- 🟡 **Exportar reportes** (CSV/PDF) y presets de fecha (últimos 7/30 días, este trimestre).
- 🟡 **Asistente IA (Fase 10):** la página `/app/ai` sigue siendo placeholder; conectar el chat simulado (`/ai/context`, `/ai/chat`, `/ai/history`).

## 3. Seguridad (producción)

- 🔴 **Tokens en `localStorage` → expuestos a XSS.** Lo más seguro es mover los tokens a cookies **httpOnly** (cambio de backend). Mientras tanto: nunca usar `dangerouslySetInnerHTML` con datos no confiables y configurar una **CSP** (Content-Security-Policy) en el hosting.
- 🔴 **Reglas de seguridad críticas deben vivir en el backend.** Ya protegimos en el frontend el auto-bloqueo del admin, pero el servidor debería **rechazar** que un usuario se desactive/degrade a sí mismo y que se desactive al **último administrador activo**. El frontend es solo UI; un llamado directo a la API se la salta.
- 🟠 **Step-up auth (pedir contraseña en acciones críticas).** Buen patrón para desactivar usuarios o cambiar roles, pero necesita un endpoint `verify-password` en el backend (hoy no existe).
- 🟠 **Manejo del 429 (rate limit).** El backend devuelve "Demasiados intentos…"; mostrar ese mensaje específico en login en vez del genérico.
- 🟡 **Cabeceras de seguridad** (CSP, HSTS, X-Frame-Options) a nivel de hosting/proxy.

## 4. DevEx e ingeniería de equipo

- 🟠 **Formato y linting automatizados.** Agregar Prettier + reglas, y **husky + lint-staged** para formatear/lintear en cada commit. Mantiene el código consistente.
- 🟠 **CI/CD.** Un pipeline (GitHub Actions) que en cada PR corra `pnpm build`, lint y tests. Hoy nada valida los cambios automáticamente.
- 🟠 **Monitoreo de errores (Sentry)** en producción, para enterarte de fallos reales de los usuarios.
- 🟡 **Documentación del frontend** (README real: setup, variables de entorno, arquitectura de carpetas, convenciones).
- 🟡 **Analítica de producto** (PostHog/GA) para entender uso.

## 5. Producción y despliegue

- 🔴 **Configuración por entorno.** Hoy `VITE_API_URL` apunta a `https://localhost:7078`. Para producir hace falta build por entorno (dev/staging/prod), la API en hosting real (Azure/AWS) con HTTPS y dominio, y **CORS del backend con el dominio real** del frontend.
- 🟠 **Base de datos en la nube + backups + migraciones formales.** Hoy es SQL local con scripts manuales; producción necesita hosting, respaldos y migraciones EF versionadas (backend).
- 🟡 **Optimización de bundle.** El code-splitting por rutas ya está (bien); revisar tamaño del bundle y presupuesto de performance.

---

## Orden recomendado (alto impacto primero)

1. **Refactor de reutilizables** (`DataTable`, `Modal` accesible, `Pagination`, `ConfirmButton`) — paga deuda y acelera todo lo demás.
2. **Toasts globales + Error Boundary** — confiabilidad y feedback consistente, esfuerzo bajo.
3. **Página de detalle de lead/cliente** (timeline de tareas + interacciones + cotizaciones) — el mayor salto de "se siente profesional".
4. **Mi perfil** (editar nombre + cambiar contraseña) — cierra el flujo de cuenta.
5. **Asistente IA (Fase 10)** — completa el plan original.
6. **Pruebas** de los flujos críticos + **CI** que corra build/lint/test.
7. **Endurecimiento de producción**: `.env` por entorno, CSP, monitoreo, y coordinar con backend (búsqueda server-side, cookies httpOnly, reglas de admin, despliegue).

## Notas para cuando se pueda tocar el backend

- Búsqueda/filtros/orden en los listados (query params).
- Cookies httpOnly para tokens (en vez de devolverlos en el body).
- Reglas de seguridad de usuarios (auto-bloqueo, último admin).
- Endpoint `verify-password` para step-up auth.
- SMTP real para correos de cotizaciones/invitaciones y recuperación de contraseña.
- Proveedor de IA real (hoy el chat es simulado).
- Migraciones EF formales + despliegue/backups.

---

*Resumen: el producto ya hace lo que promete. El siguiente nivel es ingeniería (reutilizables, tests, CI), pulido de producto (detalle de entidades, toasts, perfil) y endurecimiento para producción (config por entorno, seguridad real en backend). Nada de esto es urgente para demostrar el CRM, pero es lo que lo vuelve vendible como SaaS.*
