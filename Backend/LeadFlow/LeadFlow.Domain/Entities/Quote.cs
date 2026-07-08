namespace LeadFlow.Domain.Entities
{
    // Representa una cotizacion comercial emitida por una empresa a un cliente.
    public class Quote
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int CustomerId { get; set; }

        public int? LeadId { get; set; }

        public int CreatedByUserId { get; set; }

        public string QuoteNumber { get; set; } = string.Empty;

        public string Status { get; set; } = "Borrador";

        public string Currency { get; set; } = "CRC";

        public decimal Subtotal { get; set; }

        public decimal DiscountAmount { get; set; }

        public decimal TaxRate { get; set; } = 13;

        public decimal TaxAmount { get; set; }

        public decimal Total { get; set; }

        public DateTime IssueDate { get; set; }

        public DateTime? ExpirationDate { get; set; }

        public string? Notes { get; set; }

        public string? Terms { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public DateTime? SentAt { get; set; }

        public DateTime? AcceptedAt { get; set; }

        public DateTime? RejectedAt { get; set; }

        public Company Company { get; set; } = null!;

        public Customer Customer { get; set; } = null!;

        public Lead? Lead { get; set; }

        public User CreatedByUser { get; set; } = null!;

        public ICollection<QuoteItem> Items { get; set; } = new List<QuoteItem>();
    }
}
