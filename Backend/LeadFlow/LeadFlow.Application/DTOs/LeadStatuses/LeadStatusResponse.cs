//Este DTO será la respuesta que devuelve la API para estados del pipeline.

namespace LeadFlow.Application.DTOs.LeadStatuses
{
    public class LeadStatusResponse
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? Color { get; set; }

        public int SortOrder { get; set; }

        public bool IsWon { get; set; }

        public bool IsLost { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}