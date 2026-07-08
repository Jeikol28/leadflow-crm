namespace LeadFlow.Application.DTOs.Reports
{
    // Resume comportamiento y valor comercial de clientes.
    public class CustomerReportResponse
    {
        public DateTime? From { get; set; }

        public DateTime? To { get; set; }

        public int TotalCustomers { get; set; }

        public int NewCustomers { get; set; }

        public int CustomersWithOpenLeads { get; set; }

        public int CustomersWithAcceptedQuotes { get; set; }

        public List<ReportGroupResponse> CustomersBySource { get; set; } = new();

        public List<ReportGroupResponse> CustomersByProvince { get; set; } = new();

        public List<CustomerValueResponse> TopCustomers { get; set; } = new();
    }
}
