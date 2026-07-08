namespace LeadFlow.Application.DTOs.AI
{
    // Resume tareas vencidas o urgentes para que la IA pueda sugerir acciones de seguimiento.
    public class AiTaskInsightResponse
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string Priority { get; set; } = string.Empty;

        public DateTime? DueDate { get; set; }

        public string? CustomerName { get; set; }

        public string? LeadTitle { get; set; }

        public string AssignedUserName { get; set; } = string.Empty;
    }
}