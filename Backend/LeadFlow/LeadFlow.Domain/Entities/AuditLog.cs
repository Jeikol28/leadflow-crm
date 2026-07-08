namespace LeadFlow.Domain.Entities
{
    // Guarda acciones importantes para trazabilidad y seguridad del SaaS.
    public class AuditLog
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int? UserId { get; set; }

        public string? UserEmail { get; set; }

        public string? UserRole { get; set; }

        public string Action { get; set; } = string.Empty;

        public string EntityName { get; set; } = string.Empty;

        public int? EntityId { get; set; }

        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public Company Company { get; set; } = null!;

        public User? User { get; set; }
    }
}
