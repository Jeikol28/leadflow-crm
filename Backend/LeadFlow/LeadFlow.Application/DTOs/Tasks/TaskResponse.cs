//Respuesta que devuelve la API al frontend.

namespace LeadFlow.Application.DTOs.Tasks
{
    public class TaskResponse
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int? CustomerId { get; set; }

        public string? CustomerName { get; set; }

        public int? LeadId { get; set; }

        public string? LeadTitle { get; set; }

        public int AssignedUserId { get; set; }

        public string AssignedUserName { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Status { get; set; } = string.Empty;

        public string Priority { get; set; } = string.Empty;

        public DateTime? DueDate { get; set; }

        public DateTime? CompletedAt { get; set; }

        public bool IsOverdue { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}