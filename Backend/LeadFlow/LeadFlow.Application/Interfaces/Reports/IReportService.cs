using LeadFlow.Application.DTOs.Reports;

namespace LeadFlow.Application.Interfaces.Reports
{
    // Define reportes comerciales avanzados para analisis gerencial del SaaS.
    public interface IReportService
    {
        Task<SalesReportResponse> GetSalesReportAsync(DateTime? from, DateTime? to);

        Task<PipelineReportResponse> GetPipelineReportAsync();

        Task<ProductivityReportResponse> GetProductivityReportAsync(DateTime? from, DateTime? to);

        Task<CustomerReportResponse> GetCustomerReportAsync(DateTime? from, DateTime? to);
    }
}
