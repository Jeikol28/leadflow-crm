namespace LeadFlow.Application.DTOs.Dashboard
{
    // Representa una oportunidad comercial importante para seguimiento rapido.
    public class DashboardLeadResponse
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string CustomerName { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string Priority { get; set; } = string.Empty;

        public decimal? EstimatedAmount { get; set; }

        public int CloseProbability { get; set; }

        public int Score { get; set; }

        public string Temperature { get; set; } = string.Empty;

        public DateTime? ExpectedCloseDate { get; set; }
    }
}
