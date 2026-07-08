namespace LeadFlow.Application.DTOs.Reports
{
    // Representa un grupo agregado para graficos, tablas y KPIs de reportes.
    public class ReportGroupResponse
    {
        public string Name { get; set; } = string.Empty;

        public int Count { get; set; }

        public decimal Amount { get; set; }
    }
}
