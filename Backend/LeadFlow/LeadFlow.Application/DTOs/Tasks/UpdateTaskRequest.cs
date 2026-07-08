// DTO para editar una tarea.

namespace LeadFlow.Application.DTOs.Tasks
{
    public class UpdateTaskRequest
    {
        public int? CustomerId { get; set; }

        public int? LeadId { get; set; }

        public int AssignedUserId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Status { get; set; } = "Pendiente";

        public string Priority { get; set; } = "Media";

        public DateTime? DueDate { get; set; }

        public DateTime? CompletedAt { get; set; }
    }
}