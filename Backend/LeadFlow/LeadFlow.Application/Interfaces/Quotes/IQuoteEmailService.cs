using LeadFlow.Application.DTOs.Quotes;

namespace LeadFlow.Application.Interfaces.Quotes
{
    // Define el flujo de envio de cotizaciones por correo.
    public interface IQuoteEmailService
    {
        Task<SendQuoteEmailResponse?> SendQuoteEmailAsync(int id);
    }
}
