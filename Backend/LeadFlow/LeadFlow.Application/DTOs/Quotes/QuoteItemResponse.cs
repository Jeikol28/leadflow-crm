namespace LeadFlow.Application.DTOs.Quotes
{
    public class QuoteItemResponse
    {
        public int Id { get; set; }

        public int QuoteId { get; set; }

        public int? ServiceId { get; set; }

        public string Description { get; set; } = string.Empty;

        public decimal Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal Subtotal { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
