# Guía: Conectar el correo real (Brevo) en LeadFlow

Tu backend ya tiene el envío de correo **implementado** con MailKit en
`Backend/LeadFlow/LeadFlow.Infrastructure/Services/Email/SmtpEmailSender.cs`.
No hay que programar nada. Solo faltan **credenciales** y **configuración segura**.

El `Host` ya está preconfigurado en `appsettings.json`:
`smtp-relay.brevo.com`, puerto `587`, `UseStartTls: true`. Solo faltan
`SenderEmail`, `Username` y `Password`.

> Regla de oro: **las credenciales nunca van en `appsettings.json`** (se suben a Git).
> En desarrollo van en *user-secrets*; en producción, en *variables de entorno*.

---

## Paso 1 — Crear la cuenta en Brevo

1. Entra a https://www.brevo.com y crea una cuenta gratuita (300 correos/día, suficiente para transaccional).
2. Completa el perfil de la empresa (Brevo pide datos reales para habilitar el envío).
3. Confirma tu correo de registro.

---

## Paso 2 — Verificar el remitente (empezamos por aquí)

Brevo **no deja enviar** desde un correo que no esté verificado.

1. En Brevo: **Senders, Domains & Dedicated IPs → Senders → Add a sender**.
2. Usa un remitente con cara de sistema, p. ej. `no-reply@solucionesticas.cr`
   (o el correo que controles, incluso tu Gmail para la primera prueba).
3. Brevo envía un correo de verificación a esa dirección → ábrelo y confirma.

Ese correo verificado es el que pondrás en `EmailSettings:SenderEmail`.

---

## Paso 3 — Obtener las credenciales SMTP

1. En Brevo: menú **SMTP & API → pestaña SMTP**.
2. Verás algo así:
   - **SMTP server:** `smtp-relay.brevo.com`
   - **Port:** `587`
   - **Login:** (un correo, tu login de la cuenta) → esto va en `Username`
   - **Password / SMTP key:** haz clic en **Generate a new SMTP key**, dale un nombre
     (ej. "LeadFlow Prod") y **copia la clave** (empieza por `xsmtpsib-...`).
     Esto va en `Password`. **Solo se muestra una vez**, guárdala.

> Importante: el `Password` es la **SMTP key**, NO la contraseña con la que
> inicias sesión en Brevo. Ese es el error #1 al configurar (da error 535).

---

## Paso 4 — Guardar las credenciales de forma segura (DESARROLLO)

Tu proyecto ya tiene *user-secrets* habilitado (`UserSecretsId` en `LeadFlow.Api.csproj`).
Abre una terminal en la carpeta del proyecto API y ejecuta:

```bash
cd "Backend/LeadFlow/LeadFlow.Api"

dotnet user-secrets set "EmailSettings:SenderName"  "LeadFlow"
dotnet user-secrets set "EmailSettings:SenderEmail" "no-reply@solucionesticas.cr"
dotnet user-secrets set "EmailSettings:Username"    "TU_LOGIN_DE_BREVO"
dotnet user-secrets set "EmailSettings:Password"    "xsmtpsib-TU_CLAVE_SMTP"
dotnet user-secrets set "EmailSettings:AppBaseUrl"  "http://localhost:5173"
```

Verifica que quedaron guardados (sin exponerlos en el repo):
```bash
dotnet user-secrets list
```

Estos valores **sobrescriben** los de `appsettings.json` en tiempo de ejecución.
`appsettings.json` puede quedarse con esos campos **en blanco**.

---

## Paso 5 — Probar el envío real

1. Levanta la API:
   ```bash
   dotnet run --project LeadFlow.Api
   ```
2. Abre Swagger: `https://localhost:7078/swagger`.
3. La forma más directa de probar es **registrar una empresa**, porque eso dispara
   el correo de verificación:
   - `POST /api/auth/register-company` con un correo **real que tú controles**:
     ```json
     {
       "companyName": "Prueba Correo",
       "adminFullName": "Jeikol Prueba",
       "adminEmail": "TU_CORREO_REAL@gmail.com",
       "password": "Prueba1234!"
     }
     ```
   - Revisa la bandeja (y spam) de ese correo → debe llegar el código de 6 dígitos.
4. Alternativa: `POST /api/auth/forgot-password` con el correo de un usuario que
   ya exista → llega el enlace de recuperación.
5. En el panel de Brevo, **Transactional → Logs/Statistics**, verás cada correo
   enviado con su estado (delivered, opened, etc.).

Si el código llega al correo, **el correo real ya está conectado.** ✔

---

## Paso 6 — Configuración para PRODUCCIÓN (cuando hostees)

En el servidor **no** uses user-secrets: usa **variables de entorno**. En .NET, el
anidado `EmailSettings:Password` se escribe con doble guion bajo `EmailSettings__Password`:

```
EmailSettings__SenderName=LeadFlow
EmailSettings__SenderEmail=no-reply@solucionesticas.cr
EmailSettings__Username=TU_LOGIN_DE_BREVO
EmailSettings__Password=xsmtpsib-TU_CLAVE_SMTP
EmailSettings__AppBaseUrl=https://app.tudominio.com   ← URL pública del frontend con HTTPS
```

Se configuran en el panel del hosting (Azure App Service → Configuration,
Render/Railway → Environment, IIS → variables del sistema, Docker → `-e` o `env`).

> `AppBaseUrl` es clave: es la base de los enlaces de verificación y reset que van
> en los correos. Si queda en `localhost`, los enlaces del correo no funcionarán
> para el usuario final.

---

## Paso 7 — Hacerlo PROFESIONAL: autenticar el dominio (SPF/DKIM)

Verificar un solo remitente basta para funcionar, pero los correos pueden caer en
spam. Lo profesional es **autenticar el dominio** `solucionesticas.cr`.

**¿Tienes acceso al DNS?** Para saberlo:
- Averigua **dónde compraste/registraste** `solucionesticas.cr` (un dominio `.cr` se
  gestiona vía NIC.cr y/o el registrador/hosting donde lo contrataste).
- Si puedes entrar al panel donde agregas registros **TXT/CNAME** (registrador,
  Cloudflare, cPanel de tu hosting), entonces **sí controlas el DNS**.

**Si controlas el DNS:**
1. En Brevo: **Senders, Domains & Dedicated IPs → Domains → Add a domain** →
   escribe `solucionesticas.cr`.
2. Brevo te dará unos registros **DKIM (TXT)** y un **SPF (TXT)** (y a veces un DMARC).
3. Cópialos en el DNS de tu dominio (panel del registrador/hosting).
4. Vuelve a Brevo y pulsa **Verify / Authenticate**. Puede tardar de minutos a horas
   en propagar.
5. Una vez autenticado, cambia `SenderEmail` a algo como `no-reply@solucionesticas.cr`
   y los correos saldrán firmados por tu dominio → mucha mejor entregabilidad.

**Si no controlas el DNS (por ahora):** quédate con el remitente verificado del
Paso 2. Todo funciona; solo hay más riesgo de spam hasta autenticar el dominio.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| Error `535 Authentication failed` | Usaste la contraseña de la cuenta en vez de la SMTP key | Genera y usa la **SMTP key** (`xsmtpsib-...`) en `Password` |
| `Sender not valid / not verified` | El `SenderEmail` no está verificado en Brevo | Verifícalo (Paso 2) |
| El correo no llega / cae en spam | Dominio sin SPF/DKIM | Autentica el dominio (Paso 7) |
| Timeout al conectar al puerto 587 | Firewall/red del hosting bloquea SMTP saliente | Abre el 587 o usa el proveedor de correo del hosting |
| `EmailSettings incompleta` (excepción) | Falta `Host`, `SenderEmail`, `Username` o `Password` | Revisa user-secrets / variables de entorno |
| Los enlaces del correo apuntan a localhost | `AppBaseUrl` mal configurado | Ponlo con la URL pública del frontend |

---

## Resumen de valores por clave

| Clave (`EmailSettings:`) | Valor | Dónde se guarda |
|---|---|---|
| `Host` | `smtp-relay.brevo.com` | appsettings.json (ya está) |
| `Port` | `587` | appsettings.json (ya está) |
| `UseStartTls` | `true` | appsettings.json (ya está) |
| `SenderName` | `LeadFlow` (o el nombre de la empresa) | secrets / env |
| `SenderEmail` | remitente verificado en Brevo | secrets / env |
| `Username` | Login SMTP que muestra Brevo | secrets / env |
| `Password` | SMTP key `xsmtpsib-...` | secrets / env |
| `AppBaseUrl` | URL del frontend (dev: localhost:5173 / prod: dominio https) | secrets / env |
