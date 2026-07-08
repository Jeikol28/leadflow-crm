//DTO para cambiar solo el estado de una tarea.

namespace LeadFlow.Application.DTOs.Tasks
{
    public class UpdateTaskStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}