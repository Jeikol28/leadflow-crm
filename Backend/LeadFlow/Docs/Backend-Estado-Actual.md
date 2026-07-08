# LeadFlow Backend - Estado Actual

Este documento resume el estado actual del backend de LeadFlow para mantener una guia clara de lo construido, lo probado y lo pendiente antes de pasar a frontend, pruebas formales o despliegue.

## Objetivo del backend

LeadFlow es un CRM SaaS multiempresa orientado a gestionar clientes, oportunidades comerciales, tareas, interacciones, cotizaciones, reportes y alertas inteligentes.

La API esta construida con ASP.NET Core 8, SQL Server, Entity Framework Core y autenticacion JWT.

## Estructura de la solucion

- `LeadFlow.Api`: controladores, middleware, configuracion de Swagger, CORS, JWT y dependencias.
- `LeadFlow.Application`: DTOs e interfaces de servicios.
- `LeadFlow.Domain`: entidades principales del dominio.
- `LeadFlow.Infrastructure`: implementacion de servicios, acceso a datos y logica contra SQL Server.

## Seguridad implementada

- Autenticacion con JWT.
- Refresh tokens almacenados hasheados en base de datos.
- Logout con revocacion de refresh token.
- Cambio de contrasena validando contrasena actual.
- Password hashing con `PasswordHasher`.
- CORS configurado para frontends locales.
- Endpoints protegidos con `[Authorize]`.
- Restricciones por rol y usuario asignado.
- Separacion multiempresa usando `CompanyId` desde el token.
- Middleware global para respuestas de error uniformes.
- Auditoria para acciones administrativas importantes.

## Usuarios de prueba activos

Admin empresa:

```json
{
  "email": "admin@solucionesticas.cr",
  "password": "Admin1234!"
}
```

Vendedor:

```json
{
  "email": "carlos.vendedor@solucionesticas.cr",
  "password": "Vendedor123!"
}
```

## Modulos implementados

### Auth

Endpoints principales:

- `POST /api/auth/register-company`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`

Estado:

- Registro de empresa con usuario administrador.
- Login con token y refresh token.
- Refresh token rotativo.
- Logout.
- Cambio de contrasena.
- Onboarding automatico de empresa nueva con pipeline inicial.

### Current User

Endpoint:

- `GET /api/current-user`

Estado:

- Devuelve datos del usuario autenticado desde el token.

### Company Settings

Endpoint:

- `GET /api/company-settings`
- `PUT /api/company-settings`

Estado:

- Configuracion editable de empresa.
- Incluye moneda, IVA, prefijo de cotizacion y terminos comerciales.
- Preparado para datos fiscales y perfil comercial.

### Lead Statuses

Endpoints:

- `GET /api/lead-statuses`
- `GET /api/lead-statuses/{id}`
- `POST /api/lead-statuses`
- `PUT /api/lead-statuses/{id}`
- `DELETE /api/lead-statuses/{id}`

Estado:

- Pipeline configurable por empresa.
- Estados con orden, color, activo, ganado y perdido.
- Validacion de estados al crear o actualizar leads.

### Customers

Endpoints:

- `GET /api/customers`
- `GET /api/customers/{id}`
- `POST /api/customers`
- `PUT /api/customers/{id}`
- `DELETE /api/customers/{id}`

Estado:

- CRUD completo.
- Soft delete.
- Validaciones de nombre, correo, telefono y datos comerciales.
- Restricciones por rol: admin/gerente ven todo; vendedor/soporte ven clientes relacionados.

### Leads

Endpoints:

- `GET /api/leads`
- `GET /api/leads/{id}`
- `POST /api/leads`
- `PUT /api/leads/{id}`
- `PATCH /api/leads/{id}/status`
- `DELETE /api/leads/{id}`

Estado:

- CRUD completo.
- Soft delete.
- Scoring automatico.
- Temperatura comercial.
- Validacion de pipeline por empresa.
- Restricciones por rol y usuario asignado.

### Interactions

Endpoints:

- `GET /api/interactions`
- `GET /api/interactions/{id}`
- `POST /api/interactions`
- `PUT /api/interactions/{id}`
- `DELETE /api/interactions/{id}`

Estado:

- Historial comercial por cliente, lead y usuario.
- Soft delete.
- Preparado para llamadas, reuniones, correos, WhatsApp y notas.

### Tasks

Endpoints:

- `GET /api/tasks`
- `GET /api/tasks/{id}`
- `POST /api/tasks`
- `PUT /api/tasks/{id}`
- `PATCH /api/tasks/{id}/status`
- `DELETE /api/tasks/{id}`

Estado:

- CRUD completo.
- Estados de tarea.
- Deteccion de tareas vencidas.
- Restricciones por rol y usuario asignado.

### Services

Endpoints:

- `GET /api/services`
- `GET /api/services/{id}`
- `POST /api/services`
- `PUT /api/services/{id}`
- `DELETE /api/services/{id}`

Estado:

- Catalogo de servicios o productos por empresa.
- Soft delete.
- Preparado para reutilizar servicios en cotizaciones.

### Quotes

Endpoints:

- `GET /api/quotes`
- `GET /api/quotes/{id}`
- `POST /api/quotes`
- `PUT /api/quotes/{id}`
- `PATCH /api/quotes/{id}/status`
- `DELETE /api/quotes/{id}`

Estado:

- Cotizaciones con items.
- Calculo de subtotal, descuento, IVA y total.
- IVA configurable por empresa.
- Moneda configurable.
- Estados: `Borrador`, `Enviada`, `Aceptada`, `Rechazada`.
- Fechas de envio, aceptacion y rechazo.
- Restricciones por rol.

### Users

Endpoints:

- `GET /api/users`
- `GET /api/users/{id}`
- `POST /api/users`
- `PUT /api/users/{id}`
- `PATCH /api/users/{id}/status`

Estado:

- Administracion de usuarios por empresa.
- Roles como `AdminEmpresa`, `Gerente`, `Vendedor` y `Soporte`.
- Activacion e inactivacion de usuarios.

### Dashboard

Endpoint:

- `GET /api/dashboard/summary`

Estado:

- Metricas principales del CRM.
- Clientes, leads, pipeline, tareas, cotizaciones, conversion y actividad reciente.

### Reports

Endpoints:

- `GET /api/reports/sales`
- `GET /api/reports/pipeline`
- `GET /api/reports/productivity`
- `GET /api/reports/customers`

Estado:

- Reportes gerenciales con rangos de fecha.
- Ventas, pipeline, productividad y clientes.

### Alerts

Endpoint:

- `GET /api/alerts`

Estado:

- Alertas calculadas en tiempo real.
- Tareas vencidas.
- Cotizaciones por vencer.
- Leads calientes.
- Oportunidades de alto valor.

### Audit Logs

Endpoint:

- `GET /api/audit-logs`

Estado:

- Bitacora de acciones importantes.
- Filtrado por empresa.
- Trazabilidad para operaciones administrativas.

### Onboarding

Endpoint:

- `GET /api/onboarding/status`

Estado:

- Checklist de configuracion inicial.
- Calcula avance real de la empresa.
- Indica siguiente paso pendiente.
- Pensado para el frontend tipo "completa estas tareas".

## Tablas principales

- `Companies`
- `Users`
- `Customers`
- `Leads`
- `LeadStatuses`
- `Interactions`
- `Tasks`
- `Services`
- `Quotes`
- `QuoteItems`
- `AuditLogs`
- `RefreshTokens`

## Flujo recomendado de prueba en Swagger

1. Login con admin.
2. Authorize con Bearer token.
3. Revisar `GET /api/current-user`.
4. Revisar `GET /api/company-settings`.
5. Revisar `GET /api/onboarding/status`.
6. Crear o revisar pipeline.
7. Crear cliente.
8. Crear lead.
9. Crear tarea.
10. Crear interaccion.
11. Crear cotizacion.
12. Cambiar estado de cotizacion.
13. Revisar dashboard, reportes y alertas.

## Pendientes recomendados antes de produccion

- Mover secretos sensibles a variables de entorno o user secrets.
- Agregar rate limiting para login y endpoints sensibles.
- Agregar bloqueo temporal por intentos fallidos de login.
- Crear pruebas automatizadas de servicios principales.
- Crear migraciones formales o script unico de base de datos.
- Agregar versionado de API.
- Agregar paginacion y filtros avanzados en listados grandes.
- Agregar exportacion PDF para cotizaciones.
- Agregar envio de correos para cotizaciones, invitaciones y alertas.
- Agregar recuperacion de contrasena por correo.
- Agregar roles/permisos mas granulares si el SaaS crece.
- Preparar configuracion de despliegue.

## Fase frontend pendiente

Cuando el backend este cerrado, el frontend debe construirse con una experiencia profesional orientada a empresas:

- Login.
- Registro de empresa.
- Dashboard ejecutivo.
- Checklist de onboarding.
- Clientes.
- Leads con pipeline visual.
- Tareas.
- Interacciones.
- Cotizaciones.
- Reportes.
- Alertas.
- Configuracion de empresa.
- Usuarios y roles.

El diseño debe ser limpio, empresarial, rapido de usar y adaptable a distintos tipos de negocios.
