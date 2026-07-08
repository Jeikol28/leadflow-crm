namespace LeadFlow.Application.DTOs.Reports
{
    // Resume la salud del pipeline comercial y sus oportunidades abiertas.
    public class PipelineReportResponse
    {
        public int TotalLeads { get; set; }

        public int OpenLeads { get; set; }

        public int WonLeads { get; set; }

        public int LostLeads { get; set; }

        public decimal OpenPipelineAmount { get; set; }

        public decimal WeightedPipelineAmount { get; set; }

        public decimal AverageCloseProbability { get; set; }

        public decimal AverageScore { get; set; }

        public decimal WinRate { get; set; }

        public List<ReportGroupResponse> LeadsByStatus { get; set; } = new();

        public List<ReportGroupResponse> LeadsByPriority { get; set; } = new();

        public List<ReportGroupResponse> LeadsByTemperature { get; set; } = new();

        public List<PipelineLeadResponse> UpcomingCloseLeads { get; set; } = new();
    }
}
