using System.Net;

namespace LeadFlow.Infrastructure.Services.Email
{
    // Plantillas HTML simples y profesionales para los correos del sistema.
    public static class EmailTemplates
    {
        // Correo de recuperación de contraseña con un botón hacia el link de restablecimiento.
        public static string PasswordReset(string userName, string resetLink, int expirationMinutes)
        {
            var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(userName) ? "Hola" : userName);
            var inner = $@"
                <p style='margin:0 0 16px'>Hola {safeName},</p>
                <p style='margin:0 0 16px'>Recibimos una solicitud para restablecer la contraseña de tu cuenta en LeadFlow.</p>
                <p style='margin:0 0 24px'>Hacé clic en el botón para crear una nueva contraseña. Este enlace vence en {expirationMinutes} minutos.</p>
                <p style='margin:0 0 28px'>
                    <a href='{resetLink}' style='background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;display:inline-block'>Restablecer contraseña</a>
                </p>
                <p style='margin:0 0 8px;color:#64748b;font-size:13px'>Si el botón no funciona, copiá y pegá este enlace en tu navegador:</p>
                <p style='margin:0 0 16px;color:#0f766e;font-size:13px;word-break:break-all'>{resetLink}</p>
                <p style='margin:0;color:#94a3b8;font-size:13px'>Si vos no solicitaste esto, podés ignorar este correo; tu contraseña no cambiará.</p>";

            return Wrap("Restablecer contraseña", inner);
        }

        // Correo que acompaña el envío de una cotización (el PDF va adjunto).
        public static string Quote(string customerName, string quoteNumber)
        {
            var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(customerName) ? "Estimado cliente" : customerName);
            var safeNumber = WebUtility.HtmlEncode(quoteNumber);
            var inner = $@"
                <p style='margin:0 0 16px'>Hola {safeName},</p>
                <p style='margin:0 0 16px'>Adjuntamos la cotización <strong>{safeNumber}</strong> en formato PDF para su revisión.</p>
                <p style='margin:0 0 16px'>Quedamos atentos a cualquier consulta. ¡Gracias por su interés!</p>
                <p style='margin:0;color:#94a3b8;font-size:13px'>Este correo fue generado automáticamente por LeadFlow.</p>";

            return Wrap($"Cotización {safeNumber}", inner);
        }

        // Correo con el código de verificación de cuenta (6 dígitos).
        public static string EmailVerification(string userName, string code, int expirationMinutes)
        {
            var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(userName) ? "Hola" : userName);
            var safeCode = WebUtility.HtmlEncode(code);
            var inner = $@"
                <p style='margin:0 0 16px'>Hola {safeName},</p>
                <p style='margin:0 0 16px'>Tu código de verificación para activar tu cuenta en LeadFlow es:</p>
                <p style='margin:0 0 24px;text-align:center'>
                    <span style='display:inline-block;background:#f0fdfa;color:#042f2e;font-size:30px;font-weight:900;letter-spacing:10px;padding:14px 24px;border-radius:12px;border:1px solid #99f6e4'>{safeCode}</span>
                </p>
                <p style='margin:0 0 16px;color:#64748b;font-size:13px'>El código vence en {expirationMinutes} minutos.</p>
                <p style='margin:0;color:#94a3b8;font-size:13px'>Si vos no creaste esta cuenta, podés ignorar este correo.</p>";

            return Wrap("Verificá tu correo", inner);
        }

        // Layout base compartido por todos los correos.
        private static string Wrap(string title, string innerHtml)
        {
            return $@"<!DOCTYPE html>
<html lang='es'>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>
<body style='margin:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a'>
    <div style='max-width:560px;margin:0 auto;padding:32px 16px'>
        <div style='background:#042f2e;border-radius:16px 16px 0 0;padding:20px 28px'>
            <span style='color:#5eead4;font-weight:900;font-size:20px;letter-spacing:-0.5px'>LeadFlow</span>
        </div>
        <div style='background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:28px'>
            <h1 style='margin:0 0 20px;font-size:18px;color:#042f2e'>{WebUtility.HtmlEncode(title)}</h1>
            {innerHtml}
        </div>
        <p style='text-align:center;color:#94a3b8;font-size:12px;margin:20px 0 0'>© LeadFlow CRM</p>
    </div>
</body>
</html>";
        }
    }
}
