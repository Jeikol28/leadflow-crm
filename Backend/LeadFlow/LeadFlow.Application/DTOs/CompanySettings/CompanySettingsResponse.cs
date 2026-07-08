namespace LeadFlow.Application.DTOs.CompanySettings
{
    // Devuelve la configuracion comercial y fiscal de la empresa autenticada.
    public class CompanySettingsResponse
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

        public string DefaultCurrency { get; set; } = string.Empty;

        public decimal DefaultTaxRate { get; set; }

        public string QuotePrefix { get; set; } = string.Empty;

        public string? DefaultQuoteTerms { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
