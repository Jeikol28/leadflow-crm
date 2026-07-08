-- LeadFlow · Verificación de correo
-- Agrega las columnas de verificación a la tabla Users.
-- Ejecutalo una vez sobre tu base de datos LeadFlow (SSMS o Azure Data Studio).

ALTER TABLE Users ADD
    IsEmailVerified bit NOT NULL DEFAULT 0,
    EmailVerifiedAt datetime2 NULL,
    EmailVerificationCodeHash nvarchar(max) NULL,
    EmailVerificationCodeExpiresAt datetime2 NULL,
    EmailVerificationAttempts int NOT NULL DEFAULT 0;
GO

-- Marca las cuentas YA existentes como verificadas para no bloquearte
-- (las cuentas nuevas sí deberán verificar su correo).
UPDATE Users SET IsEmailVerified = 1, EmailVerifiedAt = SYSUTCDATETIME();
GO
