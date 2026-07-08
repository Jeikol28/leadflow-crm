namespace LeadFlow.Application.DTOs.Quotes
{
    public class QuoteResponse
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public int CustomerId { get; set; }

        public string CustomerName { get; set; } = string.Empty;

        public int? LeadId { get; set; }

        public string? LeadTitle { get; set; }

        public int CreatedByUserId { get; set; }

        public string CreatedByUserName { get; set; } = string.Empty;

        public string QuoteNumber { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string Currency { get; set; } = string.Empty;

        public decimal Subtotal { get; set; }

        public decimal DiscountAmount { get; set; }

        public decimal TaxRate { get; set; }

        public decimal TaxAmount { get; set; }

        public decimal Total { get; set; }

        public DateTime IssueDate { get; set; }

        public DateTime? ExpirationDate { get; set; }

        public string? Notes { get; set; }

        public string? Terms { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public DateTime? SentAt { get; set; }

        public DateTime? AcceptedAt { get; set; }

        public DateTime? RejectedAt { get; set; }

        public List<QuoteItemResponse> Items { get; set; } = new();
    }
}
