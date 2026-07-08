using LeadFlow.Application.DTOs.AuditLogs;
using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.Interfaces.AuditLogs;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.AuditLogs
{
    // Servicio centralizado para registrar y consultar eventos de auditoria.
    public class AuditLogService : IAuditLogService
    {
        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public AuditLogService(LeadFlowDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task LogAsync(string action, string entityName, int? entityId, string description)
        {
            var companyId = GetCurrentCompanyId();

            var auditLog = new AuditLog
            {
                CompanyId = companyId,
                UserId = _currentUserService.UserId,
                UserEmail = _currentUserService.Email,
                UserRole = _currentUserService.Role,
                Action = action,
                EntityName = entityName,
                EntityId = entityId,
                Description = description,
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }

        public async Task<PagedResponse<AuditLogResponse>> GetAllAsync(DateTime? from, DateTime? to, string? entityName, string? action, PagedRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var start = from?.Date;
            var endExclusive = to?.Date.AddDays(1);

            var query = _context.AuditLogs
                .Where(auditLog => auditLog.CompanyId == companyId);

            if (start is not null)
            {
                query = query.Where(auditLog => auditLog.CreatedAt >= start);
            }

            if (endExclusive is not null)
            {
                query = query.Where(auditLog => auditLog.CreatedAt < endExclusive);
            }

            if (!string.IsNullOrWhiteSpace(entityName))
            {
                var normalizedEntityName = entityName.Trim();
                query = query.Where(auditLog => auditLog.EntityName == normalizedEntityName);
            }

            if (!string.IsNullOrWhiteSpace(action))
            {
                var normalizedAction = action.Trim();
                query = query.Where(auditLog => auditLog.Action == normalizedAction);
            }

            var totalItems = await query.CountAsync();

            // Pagina la bitacora porque auditoria crece rapidamente en uso real.
            var items = await query
                .OrderByDescending(auditLog => auditLog.CreatedAt)
                .Skip(request.Skip)
                .Take(request.ValidPageSize)
                .Select(auditLog => new AuditLogResponse
                {
                    Id = auditLog.Id,
                    CompanyId = auditLog.CompanyId,
                    UserId = auditLog.UserId,
                    UserEmail = auditLog.UserEmail,
                    UserRole = auditLog.UserRole,
                    Action = auditLog.Action,
                    EntityName = auditLog.EntityName,
                    EntityId = auditLog.EntityId,
                    Description = auditLog.Description,
                    CreatedAt = auditLog.CreatedAt
                })
                .ToListAsync();

            return PagedResponse<AuditLogResponse>.Create(items, totalItems, request);
        }

        private int GetCurrentCompanyId()
        {
            return _currentUserService.CompanyId
                ?? throw new UnauthorizedAccessException("No se pudo identificar la empresa del usuario autenticado.");
        }
    }
}
