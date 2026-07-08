# LeadFlow — Checklist para hostear (paso a paso)

Este documento junta todo lo del informe de auditoría en orden. Marca lo que ya está
hecho y lo que tienes que ejecutar tú (porque toca tu máquina o tu hosting).

Leyenda: ✅ = ya lo hice yo en el código · 🔧 = lo ejecutas tú (te dejo los comandos)

---

## A. Arreglos de código (ya aplicados) ✅

- ✅ **HSTS** activado en producción (`Program.cs`).
- ✅ **Rate limit** en el endpoint `logout` (`AuthController.cs`).
- ✅ **`DatabaseTestController`** excluido de las compilaciones de producción (`#if DEBUG`).
- ✅ **`.gitignore`** ignora `dist`, `output`, `*.zip`, `stitch-*`.
- ✅ **JWT** con parseo robusto de expiración (`JwtTokenService.cs`).
- ✅ Correo real conectado (Brevo) — ver `GUIA-CORREO-Brevo-LeadFlow.md`.
- ✅ Mejoras de UX del informe: confirmaciones, botones de cotización, logo, aviso de
  cambios sin guardar, notificaciones leídas/no leídas, textos sin jerga.

> Nada de esto necesita acción tuya salvo **recompilar** el backend (paso C).

---

## B. Base de datos — migraciones 🔧

El mayor pendiente técnico. Sigue **`GUIA-MIGRACIONES-LeadFlow.md`**. Resumen:

```bash
cd "Backend/LeadFlow"
dotnet tool install --global dotnet-ef --version 8.0.8
dotnet ef migrations add InitialCreate -p LeadFlow.Infrastructure -s LeadFlow.Api
```
- Para la base de **producción (vacía)**: `dotnet ef database update ...`
- Para tu base **actual con datos**: usa el SQL de *baseline* (Paso 4B de esa guía).

- [ ] Migración `InitialCreate` generada y commiteada
- [ ] Aplicada a la base de producción (o base fresca verificada)
- [ ] Scripts SQL sueltos eliminados (`verificacion-correo.sql`, `Docs/SQL-Create-AiChatLogs.sql`)

---

## C. Compilar y construir 🔧

```bash
# Backend
cd "Backend/LeadFlow"
dotnet build -c Release          # no debe haber errores

# Frontend
cd "Frontend/LeadFlow.Frontend"
pnpm install
pnpm run build                   # genera la carpeta dist/ para subir
```
- [ ] `dotnet build -c Release` sin errores
- [ ] `pnpm run build` sin errores (genera `dist/`)

---

## D. Variables de entorno / secretos 🔧

Usa **`DEPLOY-variables.env.example`** — ahí está TODO lo que hay que definir en tu hosting.
Lo crítico (sin esto la API **no arranca**):

- [ ] `ConnectionStrings__DefaultConnection`
- [ ] `JwtSettings__SecretKey` (≥32 chars, distinta a la de dev — hay una lista en el ejemplo)
- [ ] `CorsSettings__AllowedOrigins__0` = dominio real del frontend (sin localhost)
- [ ] `AllowedHosts` = dominio real de la API
- [ ] `EmailSettings__*` (Brevo: SenderEmail, Username, Password, AppBaseUrl)
- [ ] `AiSettings__ApiKey` (Groq)
- [ ] `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Frontend: `.env.production` con `VITE_API_URL=https://api.tudominio.com/api`

---

## E. Limpieza del repositorio 🔧

Los artefactos ya están en `.gitignore`, pero hay que **destrackear** los que ya se subieron:
```bash
cd "Frontend/LeadFlow.Frontend"
git rm -r --cached dist output stitch-reference ../LeadFlow.Frontend.zip
git commit -m "Sacar artefactos de build del repositorio"
```
- [ ] Artefactos fuera del control de versiones
- [ ] Borra manualmente los 2 archivos huérfanos del modo oscuro que no pude eliminar:
      `src/app/providers/ThemeProvider.tsx` y `src/shared/components/ThemeToggle.tsx`

---

## F. Red, dominio y HTTPS 🔧 (en tu proveedor de hosting)

- [ ] Certificado **HTTPS** válido en la API y en el frontend
- [ ] Dominio del frontend apuntando a donde se sirve el `dist/`
- [ ] Dominio de la API apuntando al backend
- [ ] `CorsSettings:AllowedOrigins` y `VITE_API_URL` coinciden con esos dominios reales
- [ ] Correo Brevo: idealmente autenticar el dominio (SPF/DKIM) para entregabilidad
      (ver Paso 7 de `GUIA-CORREO-Brevo-LeadFlow.md`)

---

## G. Prueba final en producción 🔧

Con todo arriba, verifica el flujo real:
- [ ] Registro de empresa → llega el correo de verificación
- [ ] Verificar código → login OK
- [ ] Crear cliente / lead / cotización; aceptar cotización
- [ ] Un usuario sin sesión no entra a `/app/*` (redirige a login)
- [ ] Reset de contraseña envía correo con enlace correcto (dominio real, no localhost)

---

## Orden recomendado
**B (migración) → C (build) → D (variables) → F (dominio/HTTPS) → E (limpieza) → G (prueba).**

## Lo que NO puedo hacer yo desde aquí (requiere tu máquina/hosting)
- Generar la migración (necesita el SDK de .NET y tu base de datos).
- Poner los secretos reales en el servidor.
- Certificado HTTPS y apuntar dominios.
Todo lo demás (código y plantillas) ya quedó listo.
