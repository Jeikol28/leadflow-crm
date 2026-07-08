namespace LeadFlow.Application.Interfaces.Quotes
{
    // Define la generacion de documentos PDF para cotizaciones comerciales.
    public interface IQuotePdfService
    {
        Task<byte[]?> GenerateQuotePdfAsync(int id);
    }
}
