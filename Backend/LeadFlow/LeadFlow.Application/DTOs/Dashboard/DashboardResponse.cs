namespace LeadFlow.Application.DTOs.Dashboard
{
    // Resume los indicadores principales que el frontend mostrara en el dashboard.
    public class DashboardResponse
    {
        public int TotalCustomers { get; set; }

        public int ActiveLeads { get; set; }

        public int WonLeads { get; set; }

        public int LostLeads { get; set; }

        public decimal OpenPipelineAmount { get; set; }

        public decimal WeightedPipelineAmount { get; set; }

        public decimal AcceptedQuotesAmount { get; set; }

        public decimal CurrentMonthAcceptedQuotesAmount { get; set; }

        public int PendingTasks { get; set; }

        public int OverdueTasks { get; set; }

        public int CompletedTasks { get; set; }

        public int QuotesDraft { get; set; }

        public int QuotesSent { get; set; }

        public int QuotesAccepted { get; set; }

        public decimal ConversionRate { get; set; }

        public List<DashboardGroupResponse> LeadsByStatus { get; set; } = new();

        public List<DashboardGroupResponse> LeadsByTemperature { get; set; } = new();

        public List<DashboardGroupResponse> QuotesByStatus { get; set; } = new();

        public List<DashboardTaskResponse> UpcomingTasks { get; set; } = new();

        public List<DashboardLeadResponse> TopOpenLeads { get; set; } = new();

        public List<DashboardInteractionResponse> RecentInteractions { get; set; } = new();
    }
}
