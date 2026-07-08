namespace LeadFlow.Application.DTOs.AI
{
    // Resume cotizaciones abiertas para que la IA pueda detectar oportunidades comerciales pendientes.
    public class AiQuoteInsightResponse
    {
        public int Id { get; set; }

        public string QuoteNumber { get; set; } = string.Empty;

        public string CustomerName { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public decimal Total { get; set; }

        public string Currency { get; set; } = string.Empty;

        public DateTime IssueDate { get; set; }

        public DateTime? ExpirationDate { get; set; }

        public string CreatedByUserName { get; set; } = string.Empty;
    }
}