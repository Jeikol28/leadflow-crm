using LeadFlow.Application.DTOs.AuditLogs;
using LeadFlow.Application.DTOs.Common;

namespace LeadFlow.Application.Interfaces.AuditLogs
{
    // Define registro y consulta de eventos de auditoria por empresa.
    public interface IAuditLogService
    {
        Task LogAsync(string action, string entityName, int? entityId, string description);

        Task<PagedResponse<AuditLogResponse>> GetAllAsync(DateTime? from, DateTime? to, string? entityName, string? action, PagedRequest request);
    }
}
