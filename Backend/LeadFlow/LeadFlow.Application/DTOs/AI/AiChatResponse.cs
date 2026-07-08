namespace LeadFlow.Application.DTOs.AI
{
    // Respuesta del asistente comercial con recomendaciones y referencias del CRM.
    public class AiChatResponse
    {
        public string Answer { get; set; } = string.Empty;

        public List<string> Recommendations { get; set; } = new();

        public List<string> RelatedEntities { get; set; } = new();

        public bool IsSimulated { get; set; } = true;

        public DateTime GeneratedAt { get; set; }
    }
}
