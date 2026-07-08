namespace LeadFlow.Application.DTOs.AI
{
    // Resume indicadores comerciales clave para que la IA tenga contexto general sin consultar toda la base de datos.
    public class AiBusinessSummaryResponse
    {
        public int TotalCustomers { get; set; }

        public int ActiveLeads { get; set; }

        public int WonLeads { get; set; }

        public int LostLeads { get; set; }

        public decimal OpenPipelineAmount { get; set; }

        public decimal WeightedPipelineAmount { get; set; }

        public int PendingTasks { get; set; }

        public int OverdueTasks { get; set; }

        public int OpenQuotes { get; set; }

        public decimal OpenQuotesAmount { get; set; }

        public decimal ConversionRate { get; set; }
    }
}