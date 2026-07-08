# LeadFlow - Guia tecnica del backend para frontend

Documento de referencia para consumir la API desde el frontend de LeadFlow.

Contrato detallado de endpoints, roles, JSON y errores:

- [Backend-Contrato-API.md](Backend-Contrato-API.md)

## Estado general

- Backend: ASP.NET Core Web API con .NET 8.
- Base de datos: SQL Server local.
- Autenticacion: JWT + refresh tokens.
- Seguridad: multiempresa por `CompanyId`, roles, CORS, rate limit en endpoints sensibles, bloqueo por intentos fallidos.
- IA: contexto comercial, chat simulado e historial de consultas.
- Cotizaciones: calculo de subtotal, descuento, IVA Costa Rica y PDF.
- Listados principales: paginados con `Page` y `PageSize`.

## Usuarios de prueba

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

## Autenticacion en frontend

Endpoint de login:

`POST /api/auth/login`

El frontend debe guardar:

- `token`: se usa en `Authorization: Bearer {token}`.
- `refreshToken`: se usa para renovar sesion.
- Datos del usuario: email, rol, empresa.

Endpoint para usuario actual:

`GET /api/current-user`

Recomendacion frontend:

- Al abrir la app, validar sesion con `GET /api/current-user`.
- Si el token expira, usar `POST /api/auth/refresh-token`.
- Si refresh falla, cerrar sesion.

## Roles

- `AdminEmpresa`: administra empresa, usuarios, configuracion, datos comerciales, reportes y auditoria.
- `Gerente`: ve informacion gerencial, reportes y datos de la empresa, pero no administra usuarios criticos.
- `Vendedor`: trabaja con sus clientes, leads, tareas, interacciones y cotizaciones asignadas o creadas.

## Paginacion

Los listados paginados usan:

`?Page=1&PageSize=10`

Respuesta estandar:

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

## Endpoints principales

### Auth

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| POST | `/api/auth/register-company` | Registrar empresa y admin inicial |
| POST | `/api/auth/login` | Iniciar sesion |
| POST | `/api/auth/change-password` | Cambiar contrasena autenticado |
| POST | `/api/auth/forgot-password` | Solicitar recuperacion |
| POST | `/api/auth/reset-password` | Restablecer contrasena |
| POST | `/api/auth/refresh-token` | Renovar sesion |
| POST | `/api/auth/logout` | Cerrar sesion |

### Clientes

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/customers?Page=1&PageSize=10` | Listar clientes |
| GET | `/api/customers/{id}` | Ver cliente |
| POST | `/api/customers` | Crear cliente |
| PUT | `/api/customers/{id}` | Editar cliente |
| DELETE | `/api/customers/{id}` | Desactivar cliente |

Crear cliente:

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

### Leads

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/leads?Page=1&PageSize=10` | Listar oportunidades |
| GET | `/api/leads/{id}` | Ver oportunidad |
| POST | `/api/leads` | Crear oportunidad |
| PUT | `/api/leads/{id}` | Editar oportunidad |
| PATCH | `/api/leads/{id}/status` | Cambiar estado |
| DELETE | `/api/leads/{id}` | Desactivar oportunidad |

Crear lead:

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

### Pipeline

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/lead-statuses` | Listar estados del pipeline |
| GET | `/api/lead-statuses/{id}` | Ver estado |
| POST | `/api/lead-statuses` | Crear estado |
| PUT | `/api/lead-statuses/{id}` | Editar estado |
| DELETE | `/api/lead-statuses/{id}` | Desactivar estado |

Regla importante:

- El backend valida que el estado del lead exista y este activo para la empresa.
- Debe existir al menos un estado ganado y uno perdido para onboarding completo.

### Tareas

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/tasks?Page=1&PageSize=10` | Listar tareas |
| GET | `/api/tasks/overdue?Page=1&PageSize=10` | Tareas vencidas |
| GET | `/api/tasks/{id}` | Ver tarea |
| POST | `/api/tasks` | Crear tarea |
| PUT | `/api/tasks/{id}` | Editar tarea |
| PATCH | `/api/tasks/{id}/status` | Cambiar estado |
| DELETE | `/api/tasks/{id}` | Desactivar tarea |

Crear tarea:

```json
{
  "customerId": 4,
  "leadId": 6,
  "assignedUserId": 2,
  "title": "Dar seguimiento a propuesta CRM",
  "description": "Contactar al cliente para revisar dudas.",
  "status": "Pendiente",
  "priority": "Alta",
  "dueDate": "2026-06-10T18:00:00"
}
```

### Interacciones

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/interactions?Page=1&PageSize=10` | Listar interacciones |
| GET | `/api/interactions/{id}` | Ver interaccion |
| GET | `/api/interactions/customer/{customerId}` | Historial por cliente |
| GET | `/api/interactions/lead/{leadId}` | Historial por lead |
| POST | `/api/interactions` | Crear interaccion |
| PUT | `/api/interactions/{id}` | Editar interaccion |
| DELETE | `/api/interactions/{id}` | Desactivar interaccion |

Crear interaccion:

```json
{
  "customerId": 4,
  "leadId": 6,
  "type": "WhatsApp",
  "description": "Se contacto al cliente para coordinar una reunion.",
  "interactionDate": "2026-06-09T10:00:00"
}
```

### Servicios

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/services?Page=1&PageSize=10` | Listar servicios |
| GET | `/api/services/{id}` | Ver servicio |
| POST | `/api/services` | Crear servicio |
| PUT | `/api/services/{id}` | Editar servicio |
| DELETE | `/api/services/{id}` | Desactivar servicio |

Crear servicio:

```json
{
  "name": "Consultoria CRM",
  "description": "Analisis, configuracion y capacitacion CRM.",
  "price": 350000
}
```

### Cotizaciones

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/quotes?Page=1&PageSize=10` | Listar cotizaciones |
| GET | `/api/quotes/{id}` | Ver cotizacion |
| GET | `/api/quotes/{id}/pdf` | Descargar PDF |
| POST | `/api/quotes/{id}/send-email` | Simular envio por correo |
| POST | `/api/quotes` | Crear cotizacion |
| PUT | `/api/quotes/{id}` | Editar cotizacion |
| PATCH | `/api/quotes/{id}/status` | Cambiar estado |
| DELETE | `/api/quotes/{id}` | Desactivar cotizacion |

Crear cotizacion:

```json
{
  "customerId": 4,
  "leadId": 6,
  "status": "Borrador",
  "currency": "CRC",
  "discountAmount": 25000,
  "taxRate": 13,
  "expirationDate": "2026-07-15T00:00:00",
  "notes": "Cotizacion inicial para implementacion y seguimiento comercial.",
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

Estados usados:

- `Borrador`
- `Enviada`
- `Aceptada`
- `Rechazada`

### Usuarios

| Metodo | Endpoint | Uso | Rol |
| --- | --- | --- | --- |
| GET | `/api/users?Page=1&PageSize=10` | Listar usuarios | Admin/Gerente |
| GET | `/api/users/{id}` | Ver usuario | Admin/Gerente |
| POST | `/api/users` | Crear usuario | Admin |
| PUT | `/api/users/{id}` | Editar usuario | Admin |
| PATCH | `/api/users/{id}/status` | Activar/desactivar usuario | Admin |

Crear usuario:

```json
{
  "fullName": "Carlos Mora",
  "email": "carlos.vendedor@solucionesticas.cr",
  "password": "Vendedor123!",
  "role": "Vendedor"
}
```

### Dashboard

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/dashboard/summary` | Metricas ejecutivas |

Uso en frontend:

- Tarjetas de resumen.
- Pipeline por estado.
- Tareas proximas.
- Interacciones recientes.
- Mejores oportunidades abiertas.

### Reportes

Solo `AdminEmpresa` y `Gerente`.

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/reports/sales?from=2026-06-01&to=2026-06-30` | Reporte de ventas |
| GET | `/api/reports/pipeline?from=2026-06-01&to=2026-06-30` | Reporte de pipeline |
| GET | `/api/reports/productivity?from=2026-06-01&to=2026-06-30` | Productividad |
| GET | `/api/reports/customers?from=2026-06-01&to=2026-06-30` | Clientes |

### Alertas

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/alerts` | Alertas comerciales inteligentes |

Tipos esperados:

- Tareas vencidas.
- Cotizaciones por vencer.
- Leads calientes sin seguimiento.
- Oportunidades relevantes.

### IA

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/ai/context` | Contexto seguro del CRM |
| POST | `/api/ai/chat` | Chat comercial simulado |
| GET | `/api/ai/history?Page=1&PageSize=10` | Historial de IA |

Chat:

```json
{
  "question": "Que oportunidades comerciales debo atender primero?"
}
```

Respuesta esperada:

- `answer`
- `recommendations`
- `relatedEntities`
- `isSimulated`
- `generatedAt`

Nota:

- Hoy la IA es simulada.
- Mas adelante se puede conectar OpenAI u otro proveedor usando el mismo contrato.
- El historial ya guarda empresa, usuario, pregunta, respuesta y entidades relacionadas.

### Configuracion de empresa

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/company-settings` | Ver configuracion |
| PUT | `/api/company-settings` | Actualizar configuracion |

Uso en frontend:

- Perfil de empresa.
- Datos fiscales.
- Moneda por defecto.
- IVA por defecto.
- Prefijo de cotizaciones.
- Terminos comerciales.

### Onboarding

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/onboarding/status` | Progreso inicial de empresa |

Uso en frontend:

- Checklist de activacion.
- Mostrar siguiente paso recomendado.
- Guiar a empresas nuevas.

### Auditoria

Solo `AdminEmpresa` y `Gerente`.

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/audit-logs?Page=1&PageSize=10` | Bitacora administrativa |

Filtros:

- `from`
- `to`
- `entityName`
- `action`

## Tablas SQL manuales importantes

Scripts disponibles:

- [SQL-Create-AiChatLogs.sql](SQL-Create-AiChatLogs.sql)

Tabla agregada para IA:

- `AiChatLogs`

## Seguridad implementada

- JWT obligatorio para endpoints privados.
- Refresh tokens hasheados.
- Recuperacion de contrasena con token hasheado y uso unico.
- Bloqueo temporal por intentos fallidos.
- Rate limit en login y endpoints publicos sensibles.
- Multiempresa por `CompanyId` desde el token.
- Alcance por rol en modulos comerciales.
- Auditoria administrativa.
- CORS restringido por origenes configurados.
- `appsettings.json` no contiene secretos reales.

## Pendientes recomendados antes de produccion

- Configurar SMTP real.
- Conectar proveedor IA real.
- Agregar limites de uso de IA por plan.
- Mover base de datos a hosting/cloud.
- Revisar `AllowedHosts` para dominio real.
- Configurar CORS con dominio real del frontend.
- Agregar HTTPS/certificados en hosting.
- Crear backups de base de datos.
- Agregar monitoreo de errores.
- Preparar politicas de privacidad y manejo de datos.

## Guia para diseno del frontend

Pantallas recomendadas:

1. Login y recuperacion de contrasena.
2. Dashboard ejecutivo.
3. Onboarding/checklist inicial.
4. Clientes.
5. Leads con pipeline visual.
6. Detalle de lead con tareas, interacciones y cotizaciones.
7. Tareas.
8. Cotizaciones con vista PDF.
9. Servicios.
10. Reportes.
11. Alertas.
12. Asistente IA.
13. Usuarios.
14. Configuracion de empresa.
15. Auditoria.

Prioridad UX:

- Primero dashboard, clientes, leads y tareas.
- Luego cotizaciones y servicios.
- Despues reportes, alertas e IA.
- Finalmente configuracion avanzada y auditoria.

Notas de diseno:

- Debe sentirse como SaaS profesional, no como pagina promocional.
- Usar tablas densas pero limpias para datos.
- Usar cards solo para metricas, items repetidos o paneles concretos.
- Pipeline tipo kanban o columnas por estado.
- Formularios claros, con validaciones visibles.
- IA como asistente lateral o pagina propia con sugerencias rapidas.
- El vendedor debe ver foco operativo; admin/gerente deben ver metricas y control.
