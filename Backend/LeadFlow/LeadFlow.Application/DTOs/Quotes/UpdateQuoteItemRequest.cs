namespace LeadFlow.Application.DTOs.Quotes
{
    public class UpdateQuoteItemRequest
    {
        public int? ServiceId { get; set; }

        public string? Description { get; set; }

        public decimal Quantity { get; set; } = 1;

        public decimal? UnitPrice { get; set; }
    }
}
