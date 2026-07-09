using System.Net.Http;
using System.Net.Http.Json;
using LeadFlow.Application.Common.Email;
using LeadFlow.Application.Interfaces.Common;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace LeadFlow.Infrastructure.Services.Email
{
    // Envia correos usando la API HTTP de Brevo (HTTPS, puerto 443). Funciona en hosts que
    // bloquean el puerto SMTP saliente (como Render), a diferencia del envio por SMTP/MailKit.
    public class BrevoApiEmailSender : IEmailSender
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<BrevoApiEmailSender> _logger;

        public BrevoApiEmailSender(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<BrevoApiEmailSender> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
        {
            var settings = _configuration.GetSection("EmailSettings");
            var apiKey = settings["ApiKey"];
            var senderName = settings["SenderName"] ?? "LeadFlow";
            var senderEmail = settings["SenderEmail"];

            if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(senderEmail))
            {
                throw new InvalidOperationException(
                    "La configuracion de correo esta incompleta. Revisa EmailSettings:ApiKey y EmailSettings:SenderEmail.");
            }

            // Construye el cuerpo que espera la API de Brevo (/v3/smtp/email).
            var payload = new Dictionary<string, object?>
            {
                ["sender"] = new { name = senderName, email = senderEmail },
                ["to"] = new[] { new { email = message.ToEmail, name = message.ToName ?? message.ToEmail } },
                ["subject"] = message.Subject,
                ["htmlContent"] = message.HtmlBody
            };

            if (message.Attachment is not null && message.Attachment.Content.Length > 0)
            {
                payload["attachment"] = new[]
                {
                    new
                    {
                        content = Convert.ToBase64String(message.Attachment.Content),
                        name = message.Attachment.FileName
                    }
                };
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
            request.Headers.Add("api-key", apiKey);
            request.Content = JsonContent.Create(payload);

            using var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new InvalidOperationException($"La API de Brevo respondio {(int)response.StatusCode}: {body}");
            }

            _logger.LogInformation(
                "Correo enviado (Brevo API) a {Email} con asunto '{Subject}'.",
                message.ToEmail,
                message.Subject);
        }
    }
}
