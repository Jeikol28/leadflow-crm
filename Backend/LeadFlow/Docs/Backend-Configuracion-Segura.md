# LeadFlow - Configuracion segura del backend

Este documento resume como configurar el backend sin guardar secretos dentro del codigo fuente.

## Desarrollo local

En desarrollo, usa `dotnet user-secrets` para guardar valores sensibles.

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=.\SQLEXPRESS;Database=LeadFlowDb;User Id=leadflow_user;Password=TU_PASSWORD_LOCAL;TrustServerCertificate=True;" --project LeadFlow.Api
dotnet user-secrets set "JwtSettings:SecretKey" "TU_CLAVE_JWT_LOCAL_DE_AL_MENOS_32_CARACTERES" --project LeadFlow.Api
```

`appsettings.Development.json` puede tener configuraciones no sensibles, como los origenes locales permitidos por CORS.

## Produccion

En produccion, configura estos valores como variables de entorno del hosting:

```text
ConnectionStrings__DefaultConnection
JwtSettings__SecretKey
JwtSettings__Issuer
JwtSettings__Audience
JwtSettings__ExpirationMinutes
JwtSettings__RefreshTokenExpirationDays
SecuritySettings__MaxFailedLoginAttempts
SecuritySettings__AccountLockoutMinutes
SecuritySettings__PasswordResetTokenExpirationMinutes
CorsSettings__AllowedOrigins__0
```

Ejemplo de `CorsSettings__AllowedOrigins__0`:

```text
https://app.leadflowcr.com
```

No uses `localhost` en produccion.

## Base de datos en la nube

Cuando subas SQL Server a un proveedor externo, solo debes cambiar:

```text
ConnectionStrings__DefaultConnection
```

No cambies el codigo. La cadena debe apuntar al servidor real, base real, usuario real y contrasena real del proveedor.

## Reglas que valida la API al arrancar

La API no inicia si:

- Falta `ConnectionStrings:DefaultConnection`.
- Falta `JwtSettings:SecretKey`.
- `JwtSettings:SecretKey` tiene menos de 32 caracteres.
- Falta `JwtSettings:Issuer`.
- Falta `JwtSettings:Audience`.
- En produccion no hay dominios permitidos en CORS.
- En produccion CORS contiene `localhost` o `127.0.0.1`.

Esto evita despliegues incompletos o inseguros.
