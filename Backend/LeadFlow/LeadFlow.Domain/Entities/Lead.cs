namespace LeadFlow.Domain.Entities
{
    // Un lead es una oportunidad comercial.
    public class Lead
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int CustomerId { get; set; }

        public int? AssignedUserId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Status { get; set; } = "Nuevo";

        public string Priority { get; set; } = "Media";

        public decimal? EstimatedAmount { get; set; }

        public int CloseProbability { get; set; }

        public int Score { get; set; }

        public string Temperature { get; set; } = "Frio";

        public bool IsActive { get; set; } = true;

        public DateTime? ExpectedCloseDate { get; set; }

        public DateTime? LastContactedAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public Company Company { get; set; } = null!;

        public Customer Customer { get; set; } = null!;

        public User? AssignedUser { get; set; }

        public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();

        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();

        public ICollection<Quote> Quotes { get; set; } = new List<Quote>();
    }
}
