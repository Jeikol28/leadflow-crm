namespace LeadFlow.Domain.Entities
{
    // Representa un servicio o producto ofrecido por una empresa para crear cotizaciones.
    public class ServiceItem
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public decimal Price { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public Company Company { get; set; } = null!;

        public ICollection<QuoteItem> QuoteItems { get; set; } = new List<QuoteItem>();
    }
}
