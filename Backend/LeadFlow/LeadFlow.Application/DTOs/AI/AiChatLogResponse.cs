namespace LeadFlow.Application.DTOs.AI
{
    // Representa una pregunta y respuesta registrada del asistente de IA.
    public class AiChatLogResponse
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int UserId { get; set; }

        public string UserEmail { get; set; } = string.Empty;

        public string UserRole { get; set; } = string.Empty;

        public string Question { get; set; } = string.Empty;

        public string Answer { get; set; } = string.Empty;

        public List<string> Recommendations { get; set; } = new();

        public List<string> RelatedEntities { get; set; } = new();

        public bool IsSimulated { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
