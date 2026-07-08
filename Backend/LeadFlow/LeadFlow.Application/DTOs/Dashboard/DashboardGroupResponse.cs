namespace LeadFlow.Application.DTOs.Dashboard
{
    // Representa un grupo resumido para graficos o contadores.
    public class DashboardGroupResponse
    {
        public string Name { get; set; } = string.Empty;

        public int Count { get; set; }

        public decimal Amount { get; set; }
    }
}
