//Este DTO devuelve la información de una interacción al frontend.

namespace LeadFlow.Application.DTOs.Interactions
{
    public class InteractionResponse
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int? CustomerId { get; set; }

        public string? CustomerName { get; set; }

        public int? LeadId { get; set; }

        public string? LeadTitle { get; set; }

        public int UserId { get; set; }

        public string UserFullName { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime InteractionDate { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}