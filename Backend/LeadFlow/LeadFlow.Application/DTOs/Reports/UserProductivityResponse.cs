namespace LeadFlow.Application.DTOs.Reports
{
    // Representa los resultados comerciales y operativos de un usuario.
    public class UserProductivityResponse
    {
        public int UserId { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public int AssignedLeads { get; set; }

        public int WonLeads { get; set; }

        public int PendingTasks { get; set; }

        public int CompletedTasks { get; set; }

        public int OverdueTasks { get; set; }

        public int Interactions { get; set; }

        public int QuotesCreated { get; set; }

        public int AcceptedQuotes { get; set; }

        public decimal AcceptedAmount { get; set; }
    }
}
