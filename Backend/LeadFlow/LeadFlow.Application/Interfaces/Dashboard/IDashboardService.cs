using LeadFlow.Application.DTOs.Dashboard;

namespace LeadFlow.Application.Interfaces.Dashboard
{
    // Define las metricas ejecutivas que consume el dashboard principal del CRM.
    public interface IDashboardService
    {
        Task<DashboardResponse> GetSummaryAsync();
    }
}
