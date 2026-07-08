namespace LeadFlow.Application.DTOs.AI
{
    // Resume oportunidades importantes para que la IA pueda sugerir prioridades comerciales.
    public class AiLeadInsightResponse
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

        public string? AssignedUserName { get; set; }
    }
}