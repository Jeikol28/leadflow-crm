namespace LeadFlow.Application.DTOs.Reports
{
    // Resume el rendimiento de cotizaciones y ventas de la empresa.
    public class SalesReportResponse
    {
        public DateTime? From { get; set; }

        public DateTime? To { get; set; }

        public int TotalQuotes { get; set; }

        public int DraftQuotes { get; set; }

        public int SentQuotes { get; set; }

        public int AcceptedQuotes { get; set; }

        public int RejectedQuotes { get; set; }

        public decimal TotalQuotedAmount { get; set; }

        public decimal AcceptedAmount { get; set; }

        public decimal RejectedAmount { get; set; }

        public decimal AverageQuoteAmount { get; set; }

        public decimal AcceptanceRate { get; set; }

        public decimal DiscountsGivenAmount { get; set; }

        public decimal TaxCollectedAmount { get; set; }

        public List<SalesByMonthResponse> SalesByMonth { get; set; } = new();

        public List<ReportGroupResponse> QuotesByStatus { get; set; } = new();

        public List<TopQuoteResponse> TopAcceptedQuotes { get; set; } = new();
    }
}
