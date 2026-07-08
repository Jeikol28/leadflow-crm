//Representa un estado del pipeline comercial configurable por empresa.

namespace LeadFlow.Domain.Entities
{
    // Representa un estado personalizable del pipeline comercial de una empresa.
    public class LeadStatus
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? Color { get; set; }

        public int SortOrder { get; set; }

        public bool IsWon { get; set; }

        public bool IsLost { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public Company Company { get; set; } = null!;
    }
}