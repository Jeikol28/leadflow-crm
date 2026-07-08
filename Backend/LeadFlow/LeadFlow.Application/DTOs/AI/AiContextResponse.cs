using LeadFlow.Application.DTOs.Alerts;

namespace LeadFlow.Application.DTOs.AI
{
    // Resume informacion segura del CRM para alimentar funciones futuras de inteligencia artificial.
    public class AiContextResponse
    {
        public int CompanyId { get; set; }

        public string CompanyName { get; set; } = string.Empty;

        public int UserId { get; set; }

        public string UserEmail { get; set; } = string.Empty;

        public string UserRole { get; set; } = string.Empty;

        public DateTime GeneratedAt { get; set; }

        public AiBusinessSummaryResponse BusinessSummary { get; set; } = new();

        public List<AiLeadInsightResponse> PriorityLeads { get; set; } = new();

        public List<AiTaskInsightResponse> OverdueTasks { get; set; } = new();

        public List<AiQuoteInsightResponse> OpenQuotes { get; set; } = new();

        public List<AlertResponse> Alerts { get; set; } = new();

        public List<string> SuggestedQuestions { get; set; } = new();
    }
}