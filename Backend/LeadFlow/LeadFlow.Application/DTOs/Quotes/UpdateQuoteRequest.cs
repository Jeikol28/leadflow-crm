namespace LeadFlow.Application.DTOs.Quotes
{
    public class UpdateQuoteRequest
    {
        public int CustomerId { get; set; }

        public int? LeadId { get; set; }

        public string Status { get; set; } = "Borrador";

        public string Currency { get; set; } = "CRC";

        public decimal DiscountAmount { get; set; }

        public decimal TaxRate { get; set; } = 13;

        public DateTime? ExpirationDate { get; set; }

        public string? Notes { get; set; }

        public string? Terms { get; set; }

        public List<UpdateQuoteItemRequest> Items { get; set; } = new();
    }
}
