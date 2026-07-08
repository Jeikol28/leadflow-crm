namespace LeadFlow.Domain.Entities
{
    // Representa un item historico dentro de una cotizacion.
    public class QuoteItem
    {
        public int Id { get; set; }

        public int QuoteId { get; set; }

        public int? ServiceId { get; set; }

        public string Description { get; set; } = string.Empty;

        public decimal Quantity { get; set; } = 1;

        public decimal UnitPrice { get; set; }

        public decimal Subtotal { get; set; }

        public DateTime CreatedAt { get; set; }

        public Quote Quote { get; set; } = null!;

        public ServiceItem? Service { get; set; }
    }
}
