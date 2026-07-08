namespace LeadFlow.Application.DTOs.Reports
{
    // Representa ventas agrupadas por mes para graficos de tendencia.
    public class SalesByMonthResponse
    {
        public int Year { get; set; }

        public int Month { get; set; }

        public int QuotesCount { get; set; }

        public decimal QuotedAmount { get; set; }

        public decimal AcceptedAmount { get; set; }
    }
}
