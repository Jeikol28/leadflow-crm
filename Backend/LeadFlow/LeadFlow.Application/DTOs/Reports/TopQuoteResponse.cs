namespace LeadFlow.Application.DTOs.Reports
{
    // Representa una cotizacion destacada para analisis comercial.
    public class TopQuoteResponse
    {
        public int Id { get; set; }

        public string QuoteNumber { get; set; } = string.Empty;

        public string CustomerName { get; set; } = string.Empty;

        public string CreatedByUserName { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public decimal Total { get; set; }

        public DateTime IssueDate { get; set; }

        public DateTime? AcceptedAt { get; set; }
    }
}
