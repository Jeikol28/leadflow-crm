namespace LeadFlow.Domain.Entities
{
    public class Customer
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Email { get; set; }

        public string? Phone { get; set; }

        public string? Province { get; set; }

        public string? Canton { get; set; }

        public string? Address { get; set; }

        public string? Source { get; set; }

        public string Status { get; set; } = "Active";

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        //Un cliente pertenece a una empresa.
        public Company Company { get; set; } = null!;

        //Un cliente puede tener muchas oportunidades comerciales.
        public ICollection<Lead> Leads { get; set; } = new List<Lead>();

        public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();

        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();

        public ICollection<Quote> Quotes { get; set; } = new List<Quote>();
    }
}
