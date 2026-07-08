namespace LeadFlow.Application.DTOs.Alerts
{
    // Resume las alertas activas para mostrar contadores en el dashboard o navbar.
    public class AlertSummaryResponse
    {
        public int Total { get; set; }

        public int Critical { get; set; }

        public int High { get; set; }

        public int Medium { get; set; }

        public int Low { get; set; }

        public List<AlertResponse> Alerts { get; set; } = new();
    }
}
