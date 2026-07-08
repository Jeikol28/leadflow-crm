namespace LeadFlow.Domain.Entities
{
    public class Company
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? LegalName { get; set; }

        public string? Email { get; set; }

        public string? Phone { get; set; }

        public string? IdentificationNumber { get; set; }

        public string? Address { get; set; }

        public string? Province { get; set; }

        public string? Canton { get; set; }

        public string? Website { get; set; }

        public string? LogoUrl { get; set; }

        public string DefaultCurrency { get; set; } = "CRC";

        public decimal DefaultTaxRate { get; set; } = 13;

        public string QuotePrefix { get; set; } = "LF";

        public string? DefaultQuoteTerms { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public ICollection<User> Users { get; set; } = new List<User>();

        public ICollection<Customer> Customers { get; set; } = new List<Customer>();

        public ICollection<Lead> Leads { get; set; } = new List<Lead>();

        public ICollection<LeadStatus> LeadStatuses { get; set; } = new List<LeadStatus>();

        public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();

        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();

        public ICollection<ServiceItem> Services { get; set; } = new List<ServiceItem>();

        public ICollection<Quote> Quotes { get; set; } = new List<Quote>();

        public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

        public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();

        public ICollection<AiChatLog> AiChatLogs { get; set; } = new List<AiChatLog>();
    }
}
