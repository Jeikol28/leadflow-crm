using LeadFlow.Application.DTOs.Alerts;

namespace LeadFlow.Application.Interfaces.Alerts
{
    // Define alertas inteligentes calculadas desde la actividad comercial.
    public interface IAlertService
    {
        Task<AlertSummaryResponse> GetActiveAlertsAsync();
    }
}
