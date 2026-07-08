//Este DTO será lo que la API devuelve al frontend cuando consulta leads.
//Incluye información del cliente y del usuario asignado para mostrarla en tabla o Kanban.

namespace LeadFlow.Application.DTOs.Leads
{
    public class LeadResponse
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int CustomerId { get; set; }

        public string CustomerName { get; set; } = string.Empty;

        public int? AssignedUserId { get; set; }

        public string? AssignedUserName { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Status { get; set; } = string.Empty;

        public string Priority { get; set; } = string.Empty;

        public decimal? EstimatedAmount { get; set; }

        public int CloseProbability { get; set; }

        public int Score { get; set; }

        public string Temperature { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public DateTime? ExpectedCloseDate { get; set; }

        public DateTime? LastContactedAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}