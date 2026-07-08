namespace LeadFlow.Domain.Entities
{
    // Guarda cada consulta realizada al asistente de IA para auditoria, soporte y analisis de uso.
    public class AiChatLog
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int UserId { get; set; }

        public string UserEmail { get; set; } = string.Empty;

        public string UserRole { get; set; } = string.Empty;

        public string Question { get; set; } = string.Empty;

        public string Answer { get; set; } = string.Empty;

        public string RecommendationsJson { get; set; } = "[]";

        public string RelatedEntitiesJson { get; set; } = "[]";

        public bool IsSimulated { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        public Company Company { get; set; } = null!;

        public User User { get; set; } = null!;
    }
}
