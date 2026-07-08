namespace LeadFlow.Application.DTOs.Reports
{
    // Representa un cliente destacado por potencial, ventas o actividad.
    public class CustomerValueResponse
    {
        public int CustomerId { get; set; }

        public string CustomerName { get; set; } = string.Empty;

        public int LeadsCount { get; set; }

        public int OpenLeadsCount { get; set; }

        public int QuotesCount { get; set; }

        public int AcceptedQuotesCount { get; set; }

        public decimal PotentialAmount { get; set; }

        public decimal AcceptedAmount { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
