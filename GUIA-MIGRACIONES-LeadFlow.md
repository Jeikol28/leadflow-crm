# Guía: Migraciones de base de datos (EF Core) en LeadFlow

Objetivo: dejar de crear el esquema a mano y tener una **migración inicial** de EF Core,
para poder recrear la base de datos de forma reproducible (dev, producción, otro equipo).

Datos del proyecto (ya verificados):
- EF Core **8.0.8**, con `Microsoft.EntityFrameworkCore.Design` incluido.
- DbContext: `LeadFlowDbContext` (proyecto `LeadFlow.Infrastructure`).
- Proyecto de arranque: `LeadFlow.Api`.
- Carpeta `Migrations/` vacía (no hay migraciones todavía).

> Todos los comandos se corren desde `Backend/LeadFlow` (la carpeta de la solución).

---

## Paso 1 — Instalar la herramienta `dotnet-ef`

```bash
cd "Backend/LeadFlow"

# Si nunca la instalaste:
dotnet tool install --global dotnet-ef --version 8.0.8

# Si ya la tienes pero vieja:
dotnet tool update --global dotnet-ef
```
Verifica:
```bash
dotnet ef --version
```
(Si dice "command not found", cierra y reabre la terminal para que tome el PATH del tool.)

---

## Paso 2 — Confirmar que compila y hay conexión

La cadena de conexión de desarrollo ya está en tus *user-secrets*. Verifica:
```bash
dotnet build
dotnet user-secrets list --project LeadFlow.Api
```
Debe aparecer `ConnectionStrings:DefaultConnection`. Si no, configúrala:
```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=TU_SERVIDOR;Database=LeadFlow;Trusted_Connection=True;TrustServerCertificate=True" --project LeadFlow.Api
```

---

## Paso 3 — Generar la migración inicial

```bash
dotnet ef migrations add InitialCreate -p LeadFlow.Infrastructure -s LeadFlow.Api
```
Esto crea 3 archivos en `LeadFlow.Infrastructure/Migrations/`:
- `<fecha>_InitialCreate.cs` (el `Up()` que crea todas las tablas)
- `<fecha>_InitialCreate.Designer.cs`
- `LeadFlowDbContextModelSnapshot.cs` (foto del modelo actual)

**Ábrelo y revísalo**: debe listar las 14 tablas (Companies, Users, Customers, Leads,
LeadStatuses, Interactions, Tasks, ServiceItems, Quotes, QuoteItems, RefreshTokens,
PasswordResetTokens, AuditLogs, AiChatLogs) con sus índices únicos.

> Anota el nombre completo del archivo, por ejemplo `20260708142530_InitialCreate`.
> El número del inicio es el **MigrationId**, lo necesitas en el Paso 4B.

---

## Paso 4 — Aplicar la migración (elige tu caso)

Aquí hay que tener cuidado porque **ya tienes una base de datos con tablas creadas a mano**.

### Caso A — Base de datos NUEVA / vacía (lo ideal para producción y lo más limpio)

Crea una base vacía (por ejemplo `LeadFlow` en el servidor de producción) y aplica:
```bash
dotnet ef database update -p LeadFlow.Infrastructure -s LeadFlow.Api
```
EF crea todas las tablas desde cero. **Esta es la forma reproducible** que usarás en
producción y en cualquier equipo nuevo.

Recomendación fuerte: crea una base **de prueba vacía**, apunta la conexión ahí, corre
`database update`, levanta la API y haz un registro + login. Si funciona, tu migración es
correcta y ya es tu "fuente de verdad" del esquema.

### Caso B — Tu base de datos ACTUAL (la que ya tiene datos)

Si quieres conservar la base que ya usas (con el usuario admin y tus datos de prueba),
**NO corras `database update`** — fallaría porque las tablas ya existen. En su lugar hay
que "marcar" la migración como ya aplicada (baseline). Corre este SQL **una vez** en esa base
(SSMS, Azure Data Studio o el cliente que uses), reemplazando el MigrationId por el tuyo:

```sql
IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260708142530_InitialCreate', N'8.0.8');   -- ⬅ usa TU MigrationId
```
Con esto EF cree que `InitialCreate` ya está aplicada y no intentará recrear las tablas.
De ahí en adelante, las **próximas** migraciones sí se aplican normal con `database update`.

> Aviso: el baseline asume que tu esquema hecho a mano coincide con el que genera EF. Si
> hay diferencias (tipos, largos, índices), podrían aparecer en la próxima migración. Por
> eso, si puedes, es más seguro el **Caso A** con una base fresca para producción.

---

## Paso 5 — Flujo de ahí en adelante (cada cambio de modelo)

Cuando cambies una entidad (agregar propiedad, tabla, índice…):
```bash
dotnet ef migrations add DescribeElCambio -p LeadFlow.Infrastructure -s LeadFlow.Api
dotnet ef database update -p LeadFlow.Infrastructure -s LeadFlow.Api
```
Y **commiteas** los archivos de `Migrations/` al repo. Así cualquiera reproduce el esquema.

### Para el despliegue a producción
Dos opciones habituales:
- Correr `dotnet ef database update` contra la base de producción durante el deploy, o
- Generar un script SQL idempotente y ejecutarlo:
  ```bash
  dotnet ef migrations script --idempotent -p LeadFlow.Infrastructure -s LeadFlow.Api -o migracion.sql
  ```
  y aplicar `migracion.sql` en la base de producción.

---

## Paso 6 — Limpieza

Una vez que la migración funcione, puedes **eliminar los scripts SQL sueltos** que ya no se
necesitan (quedaron reemplazados por la migración):
- `Backend/LeadFlow/verificacion-correo.sql`
- `Backend/LeadFlow/Docs/SQL-Create-AiChatLogs.sql`

---

## Resumen de comandos (copia rápida)

```bash
cd "Backend/LeadFlow"
dotnet tool install --global dotnet-ef --version 8.0.8   # o update
dotnet build
dotnet ef migrations add InitialCreate -p LeadFlow.Infrastructure -s LeadFlow.Api

# Caso A (base nueva/vacía):
dotnet ef database update -p LeadFlow.Infrastructure -s LeadFlow.Api

# Caso B (base existente con datos): correr el SQL de baseline del Paso 4B.
```

## Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| `dotnet ef` no se reconoce | Tool no instalado o PATH sin refrescar | Instala el tool y reabre la terminal |
| `There is already an object named 'X'` al hacer update | Corriste update contra la base que ya tenía tablas | Usa el baseline del Caso B, no `database update` |
| `Unable to create a 'DbContext'` | No encuentra la conexión | Revisa user-secrets / cadena de conexión |
| La próxima migración trae cambios raros | El esquema manual no coincidía con el modelo EF | Compara y ajusta, o parte de una base fresca (Caso A) |
