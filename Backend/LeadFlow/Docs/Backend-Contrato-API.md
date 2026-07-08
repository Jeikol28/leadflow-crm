# LeadFlow - Contrato de API para frontend

Este documento define como el frontend debe consumir la API de LeadFlow.

## Base URL local

```text
https://localhost:7078
```

## Autenticacion

Los endpoints privados deben enviar:

```http
Authorization: Bearer {token}
```

El `token` viene de:

```text
POST /api/auth/login
POST /api/auth/register-company
POST /api/auth/refresh-token
```

## Formato estandar de error

Todo error debe manejarse con este contrato:

```json
{
  "statusCode": 400,
  "message": "Mensaje claro para mostrar o procesar.",
  "traceId": "0HN..."
}
```

Codigos principales:

| Codigo | Significado | Accion frontend |
| --- | --- | --- |
| 400 | Datos invalidos | Mostrar mensaje en formulario |
| 401 | No autenticado o token invalido | Intentar refresh token o cerrar sesion |
| 403 | Sin permisos | Mostrar pantalla/mensaje de acceso denegado |
| 404 | Recurso no encontrado | Mostrar estado vacio o redirigir |
| 429 | Demasiados intentos | Bloquear boton temporalmente |
| 500 | Error inesperado | Mostrar mensaje generico y registrar traceId |

## Paginacion

Los listados usan:

```text
?Page=1&PageSize=10
```

Respuesta:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 10,
  "totalItems": 0,
  "totalPages": 0,
  "hasPreviousPage": false,
  "hasNextPage": false
}
```

`PageSize` maximo: `100`.

## Roles

| Rol | Uso |
| --- | --- |
| AdminEmpresa | Control completo de empresa, usuarios, configuracion, reportes y auditoria |
| Gerente | Vision gerencial, reportes, auditoria y datos comerciales |
| Vendedor | Operacion comercial diaria: clientes, leads, tareas, interacciones y cotizaciones |

## Auth

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register-company` | No | Publico | Registrar empresa y admin |
| POST | `/api/auth/login` | No | Publico | Iniciar sesion |
| POST | `/api/auth/change-password` | Si | Todos | Cambiar contrasena |
| POST | `/api/auth/forgot-password` | No | Publico | Solicitar recuperacion |
| POST | `/api/auth/reset-password` | No | Publico | Restablecer contrasena |
| POST | `/api/auth/refresh-token` | No | Publico | Renovar sesion |
| POST | `/api/auth/logout` | No | Publico | Revocar refresh token |

### Login

```json
{
  "email": "admin@solucionesticas.cr",
  "password": "Admin1234!"
}
```

Respuesta:

```json
{
  "token": "...",
  "refreshToken": "...",
  "tokenExpiresAt": "2026-06-15T12:00:00Z",
  "refreshTokenExpiresAt": "2026-06-22T12:00:00Z",
  "email": "admin@solucionesticas.cr",
  "fullName": "Maria Rodriguez",
  "role": "AdminEmpresa",
  "companyId": 2
}
```

### Registro de empresa

```json
{
  "companyName": "Soluciones Ticas CRM",
  "adminFullName": "Maria Rodriguez",
  "adminEmail": "admin@solucionesticas.cr",
  "password": "Admin1234!"
}
```

Reglas de password:

- Minimo 10 caracteres.
- Mayuscula, minuscula, numero y simbolo.
- Sin espacios.
- No puede ser una contrasena comun.

## Usuario actual

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/current-user` | Si | Todos | Validar sesion activa |

Uso recomendado:

- Al entrar a `/app`, llamar este endpoint.
- Si responde `401`, intentar `refresh-token`.
- Si refresh falla, limpiar sesion y enviar a login.

## Clientes

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/customers?Page=1&PageSize=10` | Si | Todos | Listar clientes |
| GET | `/api/customers/{id}` | Si | Todos | Ver cliente |
| POST | `/api/customers` | Si | Todos | Crear cliente |
| PUT | `/api/customers/{id}` | Si | Todos | Editar cliente |
| DELETE | `/api/customers/{id}` | Si | Todos | Desactivar cliente |

Crear/editar:

```json
{
  "name": "Distribuidora La Sabana",
  "email": "ventas@lasabana.cr",
  "phone": "8888-5555",
  "province": "San Jose",
  "canton": "San Jose",
  "address": "Sabana Norte",
  "source": "Web",
  "status": "Active"
}
```

Notas frontend:

- `DELETE` no elimina fisicamente; desactiva.
- Telefono acepta formatos como `8888-5555`, `+506 8888-5555`.
- Email es opcional, pero si se envia debe ser valido.

## Leads

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/leads?Page=1&PageSize=10` | Si | Todos | Listar oportunidades |
| GET | `/api/leads/{id}` | Si | Todos | Ver oportunidad |
| POST | `/api/leads` | Si | Todos | Crear oportunidad |
| PUT | `/api/leads/{id}` | Si | Todos | Editar oportunidad |
| PATCH | `/api/leads/{id}/status` | Si | Todos | Cambiar estado |
| DELETE | `/api/leads/{id}` | Si | Todos | Desactivar oportunidad |

Crear/editar:

```json
{
  "customerId": 4,
  "assignedUserId": 2,
  "title": "Implementacion de automatizacion comercial",
  "description": "Cliente interesado en mejorar seguimiento y ventas.",
  "status": "Negociacion",
  "priority": "Alta",
  "estimatedAmount": 2200000,
  "closeProbability": 75,
  "expectedCloseDate": "2026-07-30T00:00:00"
}
```

Cambiar estado:

```json
{
  "status": "Ganado"
}
```

Reglas:

- `status` debe existir activo en `/api/lead-statuses`.
- `priority`: `Baja`, `Media`, `Alta`.
- `closeProbability`: 0 a 100.
- `estimatedAmount`: monto positivo.

## Pipeline / estados de lead

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/lead-statuses` | Si | Todos | Listar estados |
| GET | `/api/lead-statuses/{id}` | Si | Todos | Ver estado |
| POST | `/api/lead-statuses` | Si | Todos | Crear estado |
| PUT | `/api/lead-statuses/{id}` | Si | Todos | Editar estado |
| DELETE | `/api/lead-statuses/{id}` | Si | Todos | Desactivar estado |

Crear/editar:

```json
{
  "name": "Negociacion",
  "description": "Lead en negociacion comercial activa.",
  "color": "#F97316",
  "sortOrder": 5,
  "isWon": false,
  "isLost": false
}
```

Reglas:

- `color` debe ser hexadecimal, ejemplo `#2563EB`.
- `sortOrder`: 1 a 1000.
- Un estado no puede ser `isWon` y `isLost` al mismo tiempo.

## Tareas

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/tasks?Page=1&PageSize=10` | Si | Todos | Listar tareas |
| GET | `/api/tasks/overdue?Page=1&PageSize=10` | Si | Todos | Tareas vencidas |
| GET | `/api/tasks/{id}` | Si | Todos | Ver tarea |
| POST | `/api/tasks` | Si | Todos | Crear tarea |
| PUT | `/api/tasks/{id}` | Si | Todos | Editar tarea |
| PATCH | `/api/tasks/{id}/status` | Si | Todos | Cambiar estado |
| DELETE | `/api/tasks/{id}` | Si | Todos | Desactivar tarea |

Crear/editar:

```json
{
  "customerId": 4,
  "leadId": 6,
  "assignedUserId": 2,
  "title": "Dar seguimiento a propuesta CRM",
  "description": "Contactar al cliente para revisar dudas.",
  "status": "Pendiente",
  "priority": "Alta",
  "dueDate": "2026-06-20T18:00:00"
}
```

Estados:

- `Pendiente`
- `En proceso`
- `Completada`

## Interacciones

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/interactions?Page=1&PageSize=10` | Si | Todos | Listar interacciones |
| GET | `/api/interactions/{id}` | Si | Todos | Ver interaccion |
| GET | `/api/interactions/customer/{customerId}` | Si | Todos | Historial por cliente |
| GET | `/api/interactions/lead/{leadId}` | Si | Todos | Historial por lead |
| POST | `/api/interactions` | Si | Todos | Registrar interaccion |
| PUT | `/api/interactions/{id}` | Si | Todos | Editar interaccion |
| DELETE | `/api/interactions/{id}` | Si | Todos | Desactivar interaccion |

Crear:

```json
{
  "customerId": 4,
  "leadId": 6,
  "type": "WhatsApp",
  "description": "Se contacto al cliente para coordinar una reunion.",
  "interactionDate": "2026-06-15T10:00:00"
}
```

## Servicios

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/services?Page=1&PageSize=10` | Si | Todos | Listar servicios |
| GET | `/api/services/{id}` | Si | Todos | Ver servicio |
| POST | `/api/services` | Si | Todos | Crear servicio |
| PUT | `/api/services/{id}` | Si | Todos | Editar servicio |
| DELETE | `/api/services/{id}` | Si | Todos | Desactivar servicio |

Crear:

```json
{
  "name": "Consultoria CRM",
  "description": "Analisis, configuracion y capacitacion CRM.",
  "price": 350000
}
```

## Cotizaciones

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/quotes?Page=1&PageSize=10` | Si | Todos | Listar cotizaciones |
| GET | `/api/quotes/{id}` | Si | Todos | Ver cotizacion |
| GET | `/api/quotes/{id}/pdf` | Si | Todos | Descargar PDF |
| POST | `/api/quotes/{id}/send-email` | Si | Todos | Enviar/simular correo |
| POST | `/api/quotes` | Si | Todos | Crear cotizacion |
| PUT | `/api/quotes/{id}` | Si | Todos | Editar cotizacion |
| PATCH | `/api/quotes/{id}/status` | Si | Todos | Cambiar estado |
| DELETE | `/api/quotes/{id}` | Si | Todos | Desactivar cotizacion |

Crear:

```json
{
  "customerId": 4,
  "leadId": 6,
  "status": "Borrador",
  "currency": "CRC",
  "discountAmount": 25000,
  "taxRate": 13,
  "expirationDate": "2026-07-15T00:00:00",
  "notes": "Cotizacion inicial para implementacion comercial.",
  "terms": "Validez de 15 dias. Pago inicial del 50%.",
  "items": [
    {
      "serviceId": 2,
      "description": "Consultoria CRM personalizada",
      "quantity": 1,
      "unitPrice": 350000
    },
    {
      "description": "Capacitacion adicional para equipo comercial",
      "quantity": 2,
      "unitPrice": 75000
    }
  ]
}
```

Cambiar estado:

```json
{
  "status": "Enviada"
}
```

Estados:

- `Borrador`
- `Enviada`
- `Aceptada`
- `Rechazada`

Notas:

- El backend calcula subtotal, descuento, IVA y total.
- Para Costa Rica, usar `taxRate: 13` por defecto.

## Usuarios

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/users?Page=1&PageSize=10` | Si | AdminEmpresa, Gerente | Listar usuarios |
| GET | `/api/users/{id}` | Si | AdminEmpresa, Gerente | Ver usuario |
| POST | `/api/users` | Si | AdminEmpresa | Crear usuario |
| PUT | `/api/users/{id}` | Si | AdminEmpresa | Editar usuario |
| PATCH | `/api/users/{id}/status` | Si | AdminEmpresa | Activar/desactivar usuario |

Crear:

```json
{
  "fullName": "Carlos Mora",
  "email": "carlos.vendedor@solucionesticas.cr",
  "password": "Vendedor123!",
  "role": "Vendedor"
}
```

Protecciones:

- No se permite desactivar el propio usuario.
- No se permite dejar la empresa sin admin activo.
- No se permite degradar el ultimo admin activo.

## Configuracion de empresa

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/company-settings` | Si | Todos | Ver configuracion |
| PUT | `/api/company-settings` | Si | AdminEmpresa | Editar configuracion |

Editar:

```json
{
  "name": "Soluciones Ticas CRM",
  "legalName": "Soluciones Ticas CRM S.A.",
  "email": "admin@solucionesticas.cr",
  "phone": "2222-0000",
  "identificationNumber": "3-101-999999",
  "address": "San Jose, Costa Rica",
  "province": "San Jose",
  "canton": "San Jose",
  "website": "https://solucionesticas.cr",
  "logoUrl": null,
  "defaultCurrency": "CRC",
  "defaultTaxRate": 13,
  "quotePrefix": "STC",
  "defaultQuoteTerms": "Validez de 15 dias. Pago inicial del 50%."
}
```

## Dashboard, reportes, alertas y auditoria

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/dashboard/summary` | Si | Todos | Resumen ejecutivo |
| GET | `/api/alerts` | Si | Todos | Alertas comerciales |
| GET | `/api/reports/sales?from=2026-06-01&to=2026-06-30` | Si | AdminEmpresa, Gerente | Ventas |
| GET | `/api/reports/pipeline?from=2026-06-01&to=2026-06-30` | Si | AdminEmpresa, Gerente | Pipeline |
| GET | `/api/reports/productivity?from=2026-06-01&to=2026-06-30` | Si | AdminEmpresa, Gerente | Productividad |
| GET | `/api/reports/customers?from=2026-06-01&to=2026-06-30` | Si | AdminEmpresa, Gerente | Clientes |
| GET | `/api/audit-logs?Page=1&PageSize=10` | Si | AdminEmpresa, Gerente | Auditoria |

## IA

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/ai/context` | Si | Todos | Contexto seguro |
| POST | `/api/ai/chat` | Si | Todos | Preguntar al asistente |
| GET | `/api/ai/history?Page=1&PageSize=10` | Si | Todos | Historial de IA |

Chat:

```json
{
  "question": "Que oportunidades comerciales debo atender primero?"
}
```

Nota:

- Actualmente el asistente es simulado.
- El contrato queda preparado para conectar IA real sin cambiar el frontend.

## Onboarding

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/onboarding/status` | Si | Todos | Checklist de activacion |

Uso frontend:

- Mostrar progreso de configuracion inicial.
- Guiar a la empresa a completar perfil, pipeline, usuarios, clientes, leads, tareas, interacciones y cotizaciones.

## Health y pruebas internas

| Metodo | Endpoint | Token | Roles | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | No | Publico | Estado basico de API |
| GET | `/api/database-test/companies` | Si | AdminEmpresa | Prueba interna de DB |

`/api/database-test/companies` es util en desarrollo, pero no deberia exponerse como funcionalidad de producto final.

## Orden recomendado para conectar frontend

1. Auth: login, register, refresh, logout, current-user.
2. Layout protegido y manejo de roles.
3. Dashboard summary.
4. Customers.
5. Lead statuses y leads.
6. Tasks.
7. Interactions.
8. Services.
9. Quotes y PDF.
10. Alerts.
11. Reports.
12. AI context/chat/history.
13. Users.
14. Company settings.
15. Audit logs.

## Usuarios de prueba actuales

Admin:

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
