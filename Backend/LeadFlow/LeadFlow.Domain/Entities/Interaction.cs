//Representa una interacción comercial dentro del CRM.

namespace LeadFlow.Domain.Entities
{
    // Representa una comunicacion o evento comercial asociado a un cliente o lead.
    public class Interaction
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int? CustomerId { get; set; }

        public int? LeadId { get; set; }

        public int UserId { get; set; }

        public string Type { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime InteractionDate { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public Company Company { get; set; } = null!;

        public Customer? Customer { get; set; }

        public Lead? Lead { get; set; }

        public User User { get; set; } = null!;
    }
}