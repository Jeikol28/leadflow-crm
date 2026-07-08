using LeadFlow.Application.Common.Email;
using LeadFlow.Application.Interfaces.Common;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace LeadFlow.Infrastructure.Services.Email
{
    // Implementación real del envío de correos vía SMTP (Brevo u otro proveedor) usando MailKit.
    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
        {
            var settings = _configuration.GetSection("EmailSettings");

            var host = settings["Host"];
            var port = int.TryParse(settings["Port"], out var parsedPort) ? parsedPort : 587;
            var useStartTls = !bool.TryParse(settings["UseStartTls"], out var tls) || tls;
            var senderName = settings["SenderName"] ?? "LeadFlow";
            var senderEmail = settings["SenderEmail"];
            var username = settings["Username"];
            var password = settings["Password"];

            if (string.IsNullOrWhiteSpace(host) ||
                string.IsNullOrWhiteSpace(senderEmail) ||
                string.IsNullOrWhiteSpace(username) ||
                string.IsNullOrWhiteSpace(password))
            {
                throw new InvalidOperationException(
                    "La configuración de EmailSettings está incompleta. Revisa appsettings.json y user-secrets (Host, SenderEmail, Username, Password).");
            }

            var mime = new MimeMessage();
            mime.From.Add(new MailboxAddress(senderName, senderEmail));
            mime.To.Add(new MailboxAddress(message.ToName ?? message.ToEmail, message.ToEmail));
            mime.Subject = message.Subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = message.HtmlBody };

            if (message.Attachment is not null && message.Attachment.Content.Length > 0)
            {
                bodyBuilder.Attachments.Add(
                    message.Attachment.FileName,
                    message.Attachment.Content,
                    ContentType.Parse(message.Attachment.ContentType));
            }

            mime.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            var socketOptions = useStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.SslOnConnect;

            await client.ConnectAsync(host, port, socketOptions, cancellationToken);
            await client.AuthenticateAsync(username, password, cancellationToken);
            await client.SendAsync(mime, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Correo enviado a {Email} con asunto '{Subject}'.", message.ToEmail, message.Subject);
        }
    }
}
