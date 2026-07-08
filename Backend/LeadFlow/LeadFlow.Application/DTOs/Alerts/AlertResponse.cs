namespace LeadFlow.Application.DTOs.Alerts
{
    // Representa una alerta accionable para seguimiento comercial.
    public class AlertResponse
    {
        public string AlertId { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public string Severity { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public string RelatedEntityType { get; set; } = string.Empty;

        public int RelatedEntityId { get; set; }

        public string? CustomerName { get; set; }

        public string? AssignedUserName { get; set; }

        public DateTime? DueDate { get; set; }

        public decimal? Amount { get; set; }

        public string SuggestedAction { get; set; } = string.Empty;
    }
}
