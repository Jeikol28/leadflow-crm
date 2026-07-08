using LeadFlow.Application.DTOs.Alerts;
using LeadFlow.Application.Interfaces.Alerts;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.Alerts
{
    // Servicio que calcula alertas comerciales en tiempo real para cada empresa.
    public class AlertService : IAlertService
    {
        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public AlertService(LeadFlowDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<AlertSummaryResponse> GetActiveAlertsAsync()
        {
            var companyId = GetCurrentCompanyId();
            var userId = GetCurrentUserId();
            var canViewCompanyAlerts = CanViewCompanyAlerts();
            var now = DateTime.UtcNow;

            var alerts = new List<AlertResponse>();

            alerts.AddRange(await GetOverdueTaskAlertsAsync(companyId, userId, canViewCompanyAlerts, now));
            alerts.AddRange(await GetUpcomingTaskAlertsAsync(companyId, userId, canViewCompanyAlerts, now));
            alerts.AddRange(await GetExpiringQuoteAlertsAsync(companyId, userId, canViewCompanyAlerts, now));
            alerts.AddRange(await GetHotLeadWithoutFollowUpAlertsAsync(companyId, userId, canViewCompanyAlerts, now));
            alerts.AddRange(await GetHighValueOpenLeadAlertsAsync(companyId, userId, canViewCompanyAlerts));

            var orderedAlerts = alerts
                .OrderBy(alert => GetSeverityOrder(alert.Severity))
                .ThenBy(alert => alert.DueDate ?? DateTime.MaxValue)
                .Take(25)
                .ToList();

            return new AlertSummaryResponse
            {
                Total = orderedAlerts.Count,
                Critical = orderedAlerts.Count(alert => alert.Severity == "Critical"),
                High = orderedAlerts.Count(alert => alert.Severity == "High"),
                Medium = orderedAlerts.Count(alert => alert.Severity == "Medium"),
                Low = orderedAlerts.Count(alert => alert.Severity == "Low"),
                Alerts = orderedAlerts
            };
        }

        private async Task<List<AlertResponse>> GetOverdueTaskAlertsAsync(
            int companyId,
            int userId,
            bool canViewCompanyAlerts,
            DateTime now)
        {
            var query = _context.Tasks
                .Include(task => task.Customer)
                .Include(task => task.Lead)
                .Include(task => task.AssignedUser)
                .Where(task =>
                    task.CompanyId == companyId &&
                    task.IsActive &&
                    task.Status != "Completada" &&
                    task.DueDate != null &&
                    task.DueDate < now);

            if (!canViewCompanyAlerts)
            {
                query = query.Where(task => task.AssignedUserId == userId);
            }

            return await query
                .OrderBy(task => task.DueDate)
                .Take(10)
                .Select(task => new AlertResponse
                {
                    AlertId = $"task-overdue-{task.Id}",
                    Type = "TaskOverdue",
                    Severity = "Critical",
                    Title = "Tarea vencida",
                    Message = $"La tarea '{task.Title}' esta vencida y requiere seguimiento.",
                    RelatedEntityType = "Task",
                    RelatedEntityId = task.Id,
                    CustomerName = task.Customer != null ? task.Customer.Name : null,
                    AssignedUserName = task.AssignedUser.FullName,
                    DueDate = task.DueDate,
                    SuggestedAction = "Revisar la tarea, contactar al cliente y actualizar el estado."
                })
                .ToListAsync();
        }

        private async Task<List<AlertResponse>> GetUpcomingTaskAlertsAsync(
            int companyId,
            int userId,
            bool canViewCompanyAlerts,
            DateTime now)
        {
            var dueLimit = now.AddDays(2);

            var query = _context.Tasks
                .Include(task => task.Customer)
                .Include(task => task.AssignedUser)
                .Where(task =>
                    task.CompanyId == companyId &&
                    task.IsActive &&
                    task.Status != "Completada" &&
                    task.DueDate != null &&
                    task.DueDate >= now &&
                    task.DueDate <= dueLimit);

            if (!canViewCompanyAlerts)
            {
                query = query.Where(task => task.AssignedUserId == userId);
            }

            return await query
                .OrderBy(task => task.DueDate)
                .Take(10)
                .Select(task => new AlertResponse
                {
                    AlertId = $"task-upcoming-{task.Id}",
                    Type = "TaskUpcoming",
                    Severity = "High",
                    Title = "Tarea proxima",
                    Message = $"La tarea '{task.Title}' vence pronto.",
                    RelatedEntityType = "Task",
                    RelatedEntityId = task.Id,
                    CustomerName = task.Customer != null ? task.Customer.Name : null,
                    AssignedUserName = task.AssignedUser.FullName,
                    DueDate = task.DueDate,
                    SuggestedAction = "Completar la tarea o reprogramarla si el seguimiento cambio."
                })
                .ToListAsync();
        }

        private async Task<List<AlertResponse>> GetExpiringQuoteAlertsAsync(
            int companyId,
            int userId,
            bool canViewCompanyAlerts,
            DateTime now)
        {
            var expirationLimit = now.AddDays(7);

            var query = _context.Quotes
                .Include(quote => quote.Customer)
                .Include(quote => quote.CreatedByUser)
                .Where(quote =>
                    quote.CompanyId == companyId &&
                    quote.IsActive &&
                    quote.Status == "Enviada" &&
                    quote.ExpirationDate != null &&
                    quote.ExpirationDate >= now &&
                    quote.ExpirationDate <= expirationLimit);

            if (!canViewCompanyAlerts)
            {
                query = query.Where(quote => quote.CreatedByUserId == userId);
            }

            return await query
                .OrderBy(quote => quote.ExpirationDate)
                .Take(10)
                .Select(quote => new AlertResponse
                {
                    AlertId = $"quote-expiring-{quote.Id}",
                    Type = "QuoteExpiringSoon",
                    Severity = "High",
                    Title = "Cotizacion por vencer",
                    Message = $"La cotizacion {quote.QuoteNumber} vence pronto.",
                    RelatedEntityType = "Quote",
                    RelatedEntityId = quote.Id,
                    CustomerName = quote.Customer.Name,
                    AssignedUserName = quote.CreatedByUser.FullName,
                    DueDate = quote.ExpirationDate,
                    Amount = quote.Total,
                    SuggestedAction = "Contactar al cliente para confirmar decision antes del vencimiento."
                })
                .ToListAsync();
        }

        private async Task<List<AlertResponse>> GetHotLeadWithoutFollowUpAlertsAsync(
            int companyId,
            int userId,
            bool canViewCompanyAlerts,
            DateTime now)
        {
            var followUpLimit = now.AddDays(-7);

            var query = _context.Leads
                .Include(lead => lead.Customer)
                .Include(lead => lead.AssignedUser)
                .Where(lead =>
                    lead.CompanyId == companyId &&
                    lead.IsActive &&
                    lead.Status != "Ganado" &&
                    lead.Status != "Perdido" &&
                    lead.Temperature == "Caliente" &&
                    (lead.LastContactedAt == null || lead.LastContactedAt < followUpLimit));

            if (!canViewCompanyAlerts)
            {
                query = query.Where(lead => lead.AssignedUserId == userId);
            }

            return await query
                .OrderByDescending(lead => lead.Score)
                .Take(10)
                .Select(lead => new AlertResponse
                {
                    AlertId = $"lead-hot-no-follow-up-{lead.Id}",
                    Type = "HotLeadWithoutFollowUp",
                    Severity = "High",
                    Title = "Lead caliente sin seguimiento",
                    Message = $"El lead '{lead.Title}' esta caliente y no registra seguimiento reciente.",
                    RelatedEntityType = "Lead",
                    RelatedEntityId = lead.Id,
                    CustomerName = lead.Customer.Name,
                    AssignedUserName = lead.AssignedUser != null ? lead.AssignedUser.FullName : null,
                    DueDate = lead.ExpectedCloseDate,
                    Amount = lead.EstimatedAmount,
                    SuggestedAction = "Registrar una interaccion o crear una tarea de seguimiento."
                })
                .ToListAsync();
        }

        private async Task<List<AlertResponse>> GetHighValueOpenLeadAlertsAsync(
            int companyId,
            int userId,
            bool canViewCompanyAlerts)
        {
            var query = _context.Leads
                .Include(lead => lead.Customer)
                .Include(lead => lead.AssignedUser)
                .Where(lead =>
                    lead.CompanyId == companyId &&
                    lead.IsActive &&
                    lead.Status != "Ganado" &&
                    lead.Status != "Perdido" &&
                    lead.EstimatedAmount >= 1000000 &&
                    lead.CloseProbability >= 60);

            if (!canViewCompanyAlerts)
            {
                query = query.Where(lead => lead.AssignedUserId == userId);
            }

            return await query
                .OrderByDescending(lead => lead.EstimatedAmount)
                .Take(10)
                .Select(lead => new AlertResponse
                {
                    AlertId = $"lead-high-value-{lead.Id}",
                    Type = "HighValueOpportunity",
                    Severity = "Medium",
                    Title = "Oportunidad de alto valor",
                    Message = $"El lead '{lead.Title}' tiene alto valor y buena probabilidad de cierre.",
                    RelatedEntityType = "Lead",
                    RelatedEntityId = lead.Id,
                    CustomerName = lead.Customer.Name,
                    AssignedUserName = lead.AssignedUser != null ? lead.AssignedUser.FullName : null,
                    DueDate = lead.ExpectedCloseDate,
                    Amount = lead.EstimatedAmount,
                    SuggestedAction = "Priorizar seguimiento comercial y preparar propuesta si aplica."
                })
                .ToListAsync();
        }

        private int GetCurrentCompanyId()
        {
            return _currentUserService.CompanyId
                ?? throw new UnauthorizedAccessException("No se pudo identificar la empresa del usuario autenticado.");
        }

        private int GetCurrentUserId()
        {
            return _currentUserService.UserId
                ?? throw new UnauthorizedAccessException("No se pudo identificar el usuario autenticado.");
        }

        private bool CanViewCompanyAlerts()
        {
            return _currentUserService.Role is "AdminEmpresa" or "Gerente";
        }

        private static int GetSeverityOrder(string severity)
        {
            return severity switch
            {
                "Critical" => 1,
                "High" => 2,
                "Medium" => 3,
                "Low" => 4,
                _ => 5
            };
        }
    }
}
