namespace LeadFlow.Application.DTOs.Quotes
{
    // Resume el resultado del envio simulado de una cotizacion por correo.
    public class SendQuoteEmailResponse
    {
        public string Message { get; set; } = string.Empty;

        public int QuoteId { get; set; }

        public string QuoteNumber { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string? CustomerEmail { get; set; }

        public DateTime? SentAt { get; set; }

        public bool PdfGenerated { get; set; }

        public bool IsDevelopmentMode { get; set; }
    }
}
