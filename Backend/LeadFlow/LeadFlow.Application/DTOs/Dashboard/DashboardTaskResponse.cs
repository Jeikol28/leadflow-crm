namespace LeadFlow.Application.DTOs.Dashboard
{
    // Representa una tarea prioritaria para mostrar en el resumen operativo.
    public class DashboardTaskResponse
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string Priority { get; set; } = string.Empty;

        public DateTime? DueDate { get; set; }

        public bool IsOverdue { get; set; }

        public string? CustomerName { get; set; }

        public string? LeadTitle { get; set; }

        public string AssignedUserName { get; set; } = string.Empty;
    }
}
