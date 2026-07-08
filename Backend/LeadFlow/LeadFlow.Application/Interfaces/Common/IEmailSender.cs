using LeadFlow.Application.Common.Email;

namespace LeadFlow.Application.Interfaces.Common
{
    // Define el envío de correos. La implementación real (SMTP) vive en Infrastructure.
    public interface IEmailSender
    {
        Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default);
    }
}
