namespace LeadFlow.Application.DTOs.Reports
{
    // Resume productividad comercial por usuario para gerencia y seguimiento interno.
    public class ProductivityReportResponse
    {
        public DateTime? From { get; set; }

        public DateTime? To { get; set; }

        public int ActiveUsers { get; set; }

        public int TotalInteractions { get; set; }

        public int TotalCompletedTasks { get; set; }

        public int TotalOverdueTasks { get; set; }

        public List<UserProductivityResponse> Users { get; set; } = new();
    }
}
