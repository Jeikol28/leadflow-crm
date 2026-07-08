namespace LeadFlow.Application.DTOs.Dashboard
{
    // Representa una interaccion reciente para mostrar actividad comercial del equipo.
    public class DashboardInteractionResponse
    {
        public int Id { get; set; }

        public string Type { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime InteractionDate { get; set; }

        public string? CustomerName { get; set; }

        public string? LeadTitle { get; set; }

        public string UserFullName { get; set; } = string.Empty;
    }
}
