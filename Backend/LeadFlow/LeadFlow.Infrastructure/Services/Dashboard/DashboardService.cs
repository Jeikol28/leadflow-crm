using LeadFlow.Application.DTOs.Dashboard;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.Dashboard;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.Dashboard
{
    // Servicio que centraliza los indicadores principales del CRM por empresa.
    public class DashboardService : IDashboardService
    {
        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public DashboardService(LeadFlowDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<DashboardResponse> GetSummaryAsync()
        {
            var companyId = GetCurrentCompanyId();
            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1);
            var nextMonthStart = monthStart.AddMonths(1);

            var activeLeadsQuery = _context.Leads
                .Where(lead => lead.CompanyId == companyId && lead.IsActive);

            var openLeadsQuery = activeLeadsQuery
                .Where(lead => lead.Status != "Ganado" && lead.Status != "Perdido");

            var activeQuotesQuery = _context.Quotes
                .Where(quote => quote.CompanyId == companyId && quote.IsActive);

            var activeTasksQuery = _context.Tasks
                .Where(task => task.CompanyId == companyId && task.IsActive);

            var totalLeads = await activeLeadsQuery.CountAsync();
            var wonLeads = await activeLeadsQuery.CountAsync(lead => lead.Status == "Ganado");
            var lostLeads = await activeLeadsQuery.CountAsync(lead => lead.Status == "Perdido");

            return new DashboardResponse
            {
                TotalCustomers = await _context.Customers
                    .CountAsync(customer => customer.CompanyId == companyId && customer.IsActive),

                ActiveLeads = await openLeadsQuery.CountAsync(),
                WonLeads = wonLeads,
                LostLeads = lostLeads,

                OpenPipelineAmount = await openLeadsQuery
                    .SumAsync(lead => lead.EstimatedAmount ?? 0),

                WeightedPipelineAmount = await openLeadsQuery
                    .SumAsync(lead => (lead.EstimatedAmount ?? 0) * lead.CloseProbability / 100),

                AcceptedQuotesAmount = await activeQuotesQuery
                    .Where(quote => quote.Status == "Aceptada")
                    .SumAsync(quote => quote.Total),

                CurrentMonthAcceptedQuotesAmount = await activeQuotesQuery
                    .Where(quote =>
                        quote.Status == "Aceptada" &&
                        quote.AcceptedAt >= monthStart &&
                        quote.AcceptedAt < nextMonthStart)
                    .SumAsync(quote => quote.Total),

                PendingTasks = await activeTasksQuery
                    .CountAsync(task => task.Status != "Completada"),

                OverdueTasks = await activeTasksQuery
                    .CountAsync(task =>
                        task.Status != "Completada" &&
                        task.DueDate != null &&
                        task.DueDate < now),

                CompletedTasks = await activeTasksQuery
                    .CountAsync(task => task.Status == "Completada"),

                QuotesDraft = await activeQuotesQuery.CountAsync(quote => quote.Status == "Borrador"),
                QuotesSent = await activeQuotesQuery.CountAsync(quote => quote.Status == "Enviada"),
                QuotesAccepted = await activeQuotesQuery.CountAsync(quote => quote.Status == "Aceptada"),

                ConversionRate = CalculateConversionRate(totalLeads, wonLeads),
                LeadsByStatus = await GetLeadsByStatusAsync(companyId),
                LeadsByTemperature = await GetLeadsByTemperatureAsync(companyId),
                QuotesByStatus = await GetQuotesByStatusAsync(companyId),
                UpcomingTasks = await GetUpcomingTasksAsync(companyId, now),
                TopOpenLeads = await GetTopOpenLeadsAsync(companyId),
                RecentInteractions = await GetRecentInteractionsAsync(companyId)
            };
        }

        private async Task<List<DashboardGroupResponse>> GetLeadsByStatusAsync(int companyId)
        {
            return await _context.Leads
                .Where(lead => lead.CompanyId == companyId && lead.IsActive)
                .GroupBy(lead => lead.Status)
                .Select(group => new DashboardGroupResponse
                {
                    Name = group.Key,
                    Count = group.Count(),
                    Amount = group.Sum(lead => lead.EstimatedAmount ?? 0)
                })
                .OrderByDescending(group => group.Count)
                .ToListAsync();
        }

        private async Task<List<DashboardGroupResponse>> GetLeadsByTemperatureAsync(int companyId)
        {
            return await _context.Leads
                .Where(lead => lead.CompanyId == companyId && lead.IsActive)
                .GroupBy(lead => lead.Temperature)
                .Select(group => new DashboardGroupResponse
                {
                    Name = group.Key,
                    Count = group.Count(),
                    Amount = group.Sum(lead => lead.EstimatedAmount ?? 0)
                })
                .OrderByDescending(group => group.Count)
                .ToListAsync();
        }

        private async Task<List<DashboardGroupResponse>> GetQuotesByStatusAsync(int companyId)
        {
            return await _context.Quotes
                .Where(quote => quote.CompanyId == companyId && quote.IsActive)
                .GroupBy(quote => quote.Status)
                .Select(group => new DashboardGroupResponse
                {
                    Name = group.Key,
                    Count = group.Count(),
                    Amount = group.Sum(quote => quote.Total)
                })
                .OrderByDescending(group => group.Count)
                .ToListAsync();
        }

        private async Task<List<DashboardTaskResponse>> GetUpcomingTasksAsync(int companyId, DateTime now)
        {
            return await _context.Tasks
                .Where(task =>
                    task.CompanyId == companyId &&
                    task.IsActive &&
                    task.Status != "Completada")
                .OrderBy(task => task.DueDate ?? DateTime.MaxValue)
                .ThenByDescending(task => task.Priority)
                .Take(5)
                .Select(task => new DashboardTaskResponse
                {
                    Id = task.Id,
                    Title = task.Title,
                    Status = task.Status,
                    Priority = task.Priority,
                    DueDate = task.DueDate,
                    IsOverdue = task.DueDate != null && task.DueDate < now,
                    CustomerName = task.Customer != null ? task.Customer.Name : null,
                    LeadTitle = task.Lead != null ? task.Lead.Title : null,
                    AssignedUserName = task.AssignedUser.FullName
                })
                .ToListAsync();
        }

        private async Task<List<DashboardLeadResponse>> GetTopOpenLeadsAsync(int companyId)
        {
            return await _context.Leads
                .Where(lead =>
                    lead.CompanyId == companyId &&
                    lead.IsActive &&
                    lead.Status != "Ganado" &&
                    lead.Status != "Perdido")
                .OrderByDescending(lead => lead.Score)
                .ThenByDescending(lead => lead.EstimatedAmount ?? 0)
                .Take(5)
                .Select(lead => new DashboardLeadResponse
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
                    ExpectedCloseDate = lead.ExpectedCloseDate
                })
                .ToListAsync();
        }

        private async Task<List<DashboardInteractionResponse>> GetRecentInteractionsAsync(int companyId)
        {
            return await _context.Interactions
                .Where(interaction => interaction.CompanyId == companyId && interaction.IsActive)
                .OrderByDescending(interaction => interaction.InteractionDate)
                .Take(5)
                .Select(interaction => new DashboardInteractionResponse
                {
                    Id = interaction.Id,
                    Type = interaction.Type,
                    Description = interaction.Description,
                    InteractionDate = interaction.InteractionDate,
                    CustomerName = interaction.Customer != null ? interaction.Customer.Name : null,
                    LeadTitle = interaction.Lead != null ? interaction.Lead.Title : null,
                    UserFullName = interaction.User.FullName
                })
                .ToListAsync();
        }

        private int GetCurrentCompanyId()
        {
            return _currentUserService.CompanyId
                ?? throw new UnauthorizedAccessException("No se pudo identificar la empresa del usuario autenticado.");
        }

        private static decimal CalculateConversionRate(int totalLeads, int wonLeads)
        {
            if (totalLeads == 0)
            {
                return 0;
            }

            return Math.Round((decimal)wonLeads / totalLeads * 100, 2);
        }
    }
}
