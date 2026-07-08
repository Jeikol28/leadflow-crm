using LeadFlow.Application.DTOs.AI;
using LeadFlow.Application.Interfaces.AI;
using LeadFlow.Application.Interfaces.Alerts;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.AI
{
    // Servicio que prepara contexto seguro y resumido para futuras funciones de inteligencia artificial.
    public class AiContextService : IAiContextService
    {
        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAlertService _alertService;

        public AiContextService(
            LeadFlowDbContext context,
            ICurrentUserService currentUserService,
            IAlertService alertService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _alertService = alertService;
        }

        public async Task<AiContextResponse> GetContextAsync()
        {
            var companyId = GetCurrentCompanyId();
            var userId = GetCurrentUserId();

            var company = await _context.Companies
                .FirstOrDefaultAsync(company => company.Id == companyId && company.IsActive);

            if (company is null)
            {
                throw new UnauthorizedAccessException("Empresa no encontrada o inactiva.");
            }

            var now = DateTime.UtcNow;

            var activeLeadsQuery = _context.Leads
                .Where(lead => lead.CompanyId == companyId && lead.IsActive);

            var openLeadsQuery = activeLeadsQuery
                .Where(lead => lead.Status != "Ganado" && lead.Status != "Perdido");

            var activeTasksQuery = _context.Tasks
                .Where(task => task.CompanyId == companyId && task.IsActive);

            var activeQuotesQuery = _context.Quotes
                .Where(quote => quote.CompanyId == companyId && quote.IsActive);

            activeLeadsQuery = ApplyLeadScope(activeLeadsQuery);
            openLeadsQuery = ApplyLeadScope(openLeadsQuery);
            activeTasksQuery = ApplyTaskScope(activeTasksQuery);
            activeQuotesQuery = ApplyQuoteScope(activeQuotesQuery);

            var activeCustomersQuery = _context.Customers
                .Where(customer => customer.CompanyId == companyId && customer.IsActive);

            activeCustomersQuery = ApplyCustomerScope(activeCustomersQuery);

            var totalLeads = await activeLeadsQuery.CountAsync();
            var wonLeads = await activeLeadsQuery.CountAsync(lead => lead.Status == "Ganado");
            var lostLeads = await activeLeadsQuery.CountAsync(lead => lead.Status == "Perdido");
            var alertSummary = await _alertService.GetActiveAlertsAsync();

            return new AiContextResponse
            {
                CompanyId = company.Id,
                CompanyName = company.Name,
                UserId = userId,
                UserEmail = _currentUserService.Email ?? string.Empty,
                UserRole = _currentUserService.Role ?? string.Empty,
                GeneratedAt = DateTime.UtcNow,
                BusinessSummary = new AiBusinessSummaryResponse
                {
                    TotalCustomers = await activeCustomersQuery.CountAsync(),

                    ActiveLeads = await openLeadsQuery.CountAsync(),
                    WonLeads = wonLeads,
                    LostLeads = lostLeads,

                    OpenPipelineAmount = await openLeadsQuery
                        .SumAsync(lead => lead.EstimatedAmount ?? 0),

                    WeightedPipelineAmount = await openLeadsQuery
                        .SumAsync(lead => (lead.EstimatedAmount ?? 0) * lead.CloseProbability / 100),

                    PendingTasks = await activeTasksQuery
                        .CountAsync(task => task.Status != "Completada"),

                    OverdueTasks = await activeTasksQuery
                        .CountAsync(task =>
                            task.Status != "Completada" &&
                            task.DueDate != null &&
                            task.DueDate < now),

                    OpenQuotes = await activeQuotesQuery
                        .CountAsync(quote => quote.Status == "Borrador" || quote.Status == "Enviada"),

                    OpenQuotesAmount = await activeQuotesQuery
                        .Where(quote => quote.Status == "Borrador" || quote.Status == "Enviada")
                        .SumAsync(quote => quote.Total),

                    ConversionRate = CalculateConversionRate(totalLeads, wonLeads)
                },
                PriorityLeads = await openLeadsQuery
                    .Include(lead => lead.Customer)
                    .Include(lead => lead.AssignedUser)
                    .OrderByDescending(lead => lead.Score)
                    .ThenByDescending(lead => lead.EstimatedAmount ?? 0)
                    .ThenBy(lead => lead.ExpectedCloseDate ?? DateTime.MaxValue)
                    .Take(5)
                    .Select(lead => new AiLeadInsightResponse
                    {
                        Id = lead.Id,
                        Title = lead.Title,
                        CustomerName = lead.Customer.Name,
                        Status = lead.Status,
                        Priority = lead.Priority,
                        EstimatedAmount = lead.EstimatedAmount,
                        CloseProbability = lead.CloseProbability,
                        Score = lead.Score,
                        Temperature = lead.Temperature,
                        ExpectedCloseDate = lead.ExpectedCloseDate,
                        AssignedUserName = lead.AssignedUser != null ? lead.AssignedUser.FullName : null
                    })
                    .ToListAsync(),
                OverdueTasks = await activeTasksQuery
                    .Include(task => task.Customer)
                    .Include(task => task.Lead)
                    .Include(task => task.AssignedUser)
                    .Where(task =>
                        task.Status != "Completada" &&
                        task.DueDate != null &&
                        task.DueDate < now)
                    .OrderBy(task => task.DueDate)
                    .ThenByDescending(task => task.Priority)
                    .Take(5)
                    .Select(task => new AiTaskInsightResponse
                    {
                        Id = task.Id,
                        Title = task.Title,
                        Status = task.Status,
                        Priority = task.Priority,
                        DueDate = task.DueDate,
                        CustomerName = task.Customer != null ? task.Customer.Name : null,
                        LeadTitle = task.Lead != null ? task.Lead.Title : null,
                        AssignedUserName = task.AssignedUser.FullName
                    })
                    .ToListAsync(),
                OpenQuotes = await activeQuotesQuery
                    .Include(quote => quote.Customer)
                    .Include(quote => quote.CreatedByUser)
                    .Where(quote => quote.Status == "Borrador" || quote.Status == "Enviada")
                    .OrderBy(quote => quote.ExpirationDate ?? DateTime.MaxValue)
                    .ThenByDescending(quote => quote.Total)
                    .Take(5)
                    .Select(quote => new AiQuoteInsightResponse
                    {
                        Id = quote.Id,
                        QuoteNumber = quote.QuoteNumber,
                        CustomerName = quote.Customer.Name,
                        Status = quote.Status,
                        Total = quote.Total,
                        Currency = quote.Currency,
                        IssueDate = quote.IssueDate,
                        ExpirationDate = quote.ExpirationDate,
                        CreatedByUserName = quote.CreatedByUser.FullName
                    })
                    .ToListAsync(),
                Alerts = alertSummary.Alerts
                    .OrderBy(alert => GetSeverityOrder(alert.Severity))
                    .Take(5)
                    .ToList(),
                SuggestedQuestions = BuildSuggestedQuestions()
            };
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

        private bool CanManageCompanyScope()
        {
            return _currentUserService.Role is "AdminEmpresa" or "Gerente";
        }

        private IQueryable<Domain.Entities.Lead> ApplyLeadScope(IQueryable<Domain.Entities.Lead> query)
        {
            if (CanManageCompanyScope())
            {
                return query;
            }

            var userId = GetCurrentUserId();

            return query.Where(lead => lead.AssignedUserId == userId);
        }

        private IQueryable<Domain.Entities.TaskItem> ApplyTaskScope(IQueryable<Domain.Entities.TaskItem> query)
        {
            if (CanManageCompanyScope())
            {
                return query;
            }

            var userId = GetCurrentUserId();

            return query.Where(task => task.AssignedUserId == userId);
        }

        private IQueryable<Domain.Entities.Quote> ApplyQuoteScope(IQueryable<Domain.Entities.Quote> query)
        {
            if (CanManageCompanyScope())
            {
                return query;
            }

            var userId = GetCurrentUserId();

            return query.Where(quote => quote.CreatedByUserId == userId);
        }

        private IQueryable<Domain.Entities.Customer> ApplyCustomerScope(IQueryable<Domain.Entities.Customer> query)
        {
            if (CanManageCompanyScope())
            {
                return query;
            }

            var userId = GetCurrentUserId();

            return query.Where(customer =>
                customer.Leads.Any(lead => lead.IsActive && lead.AssignedUserId == userId) ||
                customer.Tasks.Any(task => task.IsActive && task.AssignedUserId == userId) ||
                customer.Interactions.Any(interaction => interaction.IsActive && interaction.UserId == userId) ||
                customer.Quotes.Any(quote => quote.IsActive && quote.CreatedByUserId == userId));
        }

        private static decimal CalculateConversionRate(int totalLeads, int wonLeads)
        {
            if (totalLeads == 0)
            {
                return 0;
            }

            return Math.Round((decimal)wonLeads / totalLeads * 100, 2);
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

        private static List<string> BuildSuggestedQuestions()
        {
            return new List<string>
            {
                "Que oportunidades comerciales debo atender primero?",
                "Que tareas vencidas requieren seguimiento hoy?",
                "Que cotizaciones abiertas deberia revisar?",
                "Como esta mi pipeline comercial?",
                "Que acciones recomiendas para mejorar la conversion?"
            };
        }
    }
}
