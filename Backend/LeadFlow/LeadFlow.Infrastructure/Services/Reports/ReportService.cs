using LeadFlow.Application.DTOs.Reports;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.Reports;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.Reports
{
    // Servicio de reportes gerenciales con datos aislados por empresa.
    public class ReportService : IReportService
    {
        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public ReportService(LeadFlowDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<SalesReportResponse> GetSalesReportAsync(DateTime? from, DateTime? to)
        {
            var companyId = GetCurrentCompanyId();
            var range = BuildDateRange(from, to);

            var quotesQuery = _context.Quotes
                .Where(quote => quote.CompanyId == companyId && quote.IsActive);

            quotesQuery = ApplyDateRange(quotesQuery, range.Start, range.EndExclusive, quote => quote.IssueDate);

            var totalQuotes = await quotesQuery.CountAsync();
            var acceptedQuotes = await quotesQuery.CountAsync(quote => quote.Status == "Aceptada");

            return new SalesReportResponse
            {
                From = range.Start,
                To = range.EndInclusive,
                TotalQuotes = totalQuotes,
                DraftQuotes = await quotesQuery.CountAsync(quote => quote.Status == "Borrador"),
                SentQuotes = await quotesQuery.CountAsync(quote => quote.Status == "Enviada"),
                AcceptedQuotes = acceptedQuotes,
                RejectedQuotes = await quotesQuery.CountAsync(quote => quote.Status == "Rechazada"),
                TotalQuotedAmount = await quotesQuery.SumAsync(quote => quote.Total),
                AcceptedAmount = await quotesQuery.Where(quote => quote.Status == "Aceptada").SumAsync(quote => quote.Total),
                RejectedAmount = await quotesQuery.Where(quote => quote.Status == "Rechazada").SumAsync(quote => quote.Total),
                AverageQuoteAmount = totalQuotes == 0 ? 0 : Math.Round(await quotesQuery.AverageAsync(quote => quote.Total), 2),
                AcceptanceRate = CalculateRate(totalQuotes, acceptedQuotes),
                DiscountsGivenAmount = await quotesQuery.SumAsync(quote => quote.DiscountAmount),
                TaxCollectedAmount = await quotesQuery.Where(quote => quote.Status == "Aceptada").SumAsync(quote => quote.TaxAmount),
                SalesByMonth = await GetSalesByMonthAsync(quotesQuery),
                QuotesByStatus = await GetQuotesByStatusAsync(quotesQuery),
                TopAcceptedQuotes = await GetTopAcceptedQuotesAsync(quotesQuery)
            };
        }

        public async Task<PipelineReportResponse> GetPipelineReportAsync()
        {
            var companyId = GetCurrentCompanyId();

            var leadsQuery = _context.Leads
                .Where(lead => lead.CompanyId == companyId && lead.IsActive);

            var openLeadsQuery = leadsQuery
                .Where(lead => lead.Status != "Ganado" && lead.Status != "Perdido");

            var totalLeads = await leadsQuery.CountAsync();
            var wonLeads = await leadsQuery.CountAsync(lead => lead.Status == "Ganado");
            var openLeads = await openLeadsQuery.CountAsync();

            return new PipelineReportResponse
            {
                TotalLeads = totalLeads,
                OpenLeads = openLeads,
                WonLeads = wonLeads,
                LostLeads = await leadsQuery.CountAsync(lead => lead.Status == "Perdido"),
                OpenPipelineAmount = await openLeadsQuery.SumAsync(lead => lead.EstimatedAmount ?? 0),
                WeightedPipelineAmount = await openLeadsQuery.SumAsync(lead => (lead.EstimatedAmount ?? 0) * lead.CloseProbability / 100),
                AverageCloseProbability = openLeads == 0 ? 0 : Math.Round((decimal)await openLeadsQuery.AverageAsync(lead => lead.CloseProbability), 2),
                AverageScore = openLeads == 0 ? 0 : Math.Round((decimal)await openLeadsQuery.AverageAsync(lead => lead.Score), 2),
                WinRate = CalculateRate(totalLeads, wonLeads),
                LeadsByStatus = await GetLeadsByGroupAsync(leadsQuery, "Status"),
                LeadsByPriority = await GetLeadsByGroupAsync(leadsQuery, "Priority"),
                LeadsByTemperature = await GetLeadsByGroupAsync(leadsQuery, "Temperature"),
                UpcomingCloseLeads = await GetUpcomingCloseLeadsAsync(openLeadsQuery)
            };
        }

        public async Task<ProductivityReportResponse> GetProductivityReportAsync(DateTime? from, DateTime? to)
        {
            var companyId = GetCurrentCompanyId();
            var range = BuildDateRange(from, to);
            var start = range.Start;
            var endExclusive = range.EndExclusive;
            var now = DateTime.UtcNow;

            var users = await _context.Users
                .Where(user => user.CompanyId == companyId && user.IsActive)
                .OrderBy(user => user.FullName)
                .Select(user => new UserProductivityResponse
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = user.Role,
                    AssignedLeads = user.AssignedLeads.Count(lead => lead.IsActive),
                    WonLeads = user.AssignedLeads.Count(lead => lead.IsActive && lead.Status == "Ganado"),
                    PendingTasks = user.AssignedTasks.Count(task => task.IsActive && task.Status != "Completada"),
                    CompletedTasks = user.AssignedTasks.Count(task =>
                        task.IsActive &&
                        task.Status == "Completada" &&
                        task.CompletedAt != null &&
                        (start == null || task.CompletedAt >= start) &&
                        (endExclusive == null || task.CompletedAt < endExclusive)),
                    OverdueTasks = user.AssignedTasks.Count(task =>
                        task.IsActive &&
                        task.Status != "Completada" &&
                        task.DueDate != null &&
                        task.DueDate < now),
                    Interactions = user.Interactions.Count(interaction =>
                        interaction.IsActive &&
                        (start == null || interaction.InteractionDate >= start) &&
                        (endExclusive == null || interaction.InteractionDate < endExclusive)),
                    QuotesCreated = user.CreatedQuotes.Count(quote =>
                        quote.IsActive &&
                        (start == null || quote.IssueDate >= start) &&
                        (endExclusive == null || quote.IssueDate < endExclusive)),
                    AcceptedQuotes = user.CreatedQuotes.Count(quote =>
                        quote.IsActive &&
                        quote.Status == "Aceptada" &&
                        (start == null || quote.IssueDate >= start) &&
                        (endExclusive == null || quote.IssueDate < endExclusive)),
                    AcceptedAmount = user.CreatedQuotes
                        .Where(quote =>
                            quote.IsActive &&
                            quote.Status == "Aceptada" &&
                            (start == null || quote.IssueDate >= start) &&
                            (endExclusive == null || quote.IssueDate < endExclusive))
                        .Sum(quote => quote.Total)
                })
                .ToListAsync();

            return new ProductivityReportResponse
            {
                From = range.Start,
                To = range.EndInclusive,
                ActiveUsers = users.Count,
                TotalInteractions = users.Sum(user => user.Interactions),
                TotalCompletedTasks = users.Sum(user => user.CompletedTasks),
                TotalOverdueTasks = users.Sum(user => user.OverdueTasks),
                Users = users
            };
        }

        public async Task<CustomerReportResponse> GetCustomerReportAsync(DateTime? from, DateTime? to)
        {
            var companyId = GetCurrentCompanyId();
            var range = BuildDateRange(from, to);
            var start = range.Start;
            var endExclusive = range.EndExclusive;

            var customersQuery = _context.Customers
                .Where(customer => customer.CompanyId == companyId && customer.IsActive);

            return new CustomerReportResponse
            {
                From = range.Start,
                To = range.EndInclusive,
                TotalCustomers = await customersQuery.CountAsync(),
                NewCustomers = await customersQuery.CountAsync(customer =>
                    (start == null || customer.CreatedAt >= start) &&
                    (endExclusive == null || customer.CreatedAt < endExclusive)),
                CustomersWithOpenLeads = await customersQuery.CountAsync(customer =>
                    customer.Leads.Any(lead => lead.IsActive && lead.Status != "Ganado" && lead.Status != "Perdido")),
                CustomersWithAcceptedQuotes = await customersQuery.CountAsync(customer =>
                    customer.Quotes.Any(quote => quote.IsActive && quote.Status == "Aceptada")),
                CustomersBySource = await GetCustomersBySourceAsync(customersQuery),
                CustomersByProvince = await GetCustomersByProvinceAsync(customersQuery),
                TopCustomers = await GetTopCustomersAsync(customersQuery)
            };
        }

        private async Task<List<SalesByMonthResponse>> GetSalesByMonthAsync(IQueryable<Domain.Entities.Quote> quotesQuery)
        {
            return await quotesQuery
                .GroupBy(quote => new { quote.IssueDate.Year, quote.IssueDate.Month })
                .Select(group => new SalesByMonthResponse
                {
                    Year = group.Key.Year,
                    Month = group.Key.Month,
                    QuotesCount = group.Count(),
                    QuotedAmount = group.Sum(quote => quote.Total),
                    AcceptedAmount = group.Where(quote => quote.Status == "Aceptada").Sum(quote => quote.Total)
                })
                .OrderBy(group => group.Year)
                .ThenBy(group => group.Month)
                .ToListAsync();
        }

        private async Task<List<ReportGroupResponse>> GetQuotesByStatusAsync(IQueryable<Domain.Entities.Quote> quotesQuery)
        {
            return await quotesQuery
                .GroupBy(quote => quote.Status)
                .Select(group => new ReportGroupResponse
                {
                    Name = group.Key,
                    Count = group.Count(),
                    Amount = group.Sum(quote => quote.Total)
                })
                .OrderByDescending(group => group.Amount)
                .ToListAsync();
        }

        private async Task<List<TopQuoteResponse>> GetTopAcceptedQuotesAsync(IQueryable<Domain.Entities.Quote> quotesQuery)
        {
            return await quotesQuery
                .Where(quote => quote.Status == "Aceptada")
                .OrderByDescending(quote => quote.Total)
                .Take(10)
                .Select(quote => new TopQuoteResponse
                {
                    Id = quote.Id,
                    QuoteNumber = quote.QuoteNumber,
                    CustomerName = quote.Customer.Name,
                    CreatedByUserName = quote.CreatedByUser.FullName,
                    Status = quote.Status,
                    Total = quote.Total,
                    IssueDate = quote.IssueDate,
                    AcceptedAt = quote.AcceptedAt
                })
                .ToListAsync();
        }

        private async Task<List<ReportGroupResponse>> GetLeadsByGroupAsync(IQueryable<Domain.Entities.Lead> leadsQuery, string groupName)
        {
            if (groupName == "Priority")
            {
                return await leadsQuery
                    .GroupBy(lead => lead.Priority)
                    .Select(group => new ReportGroupResponse
                    {
                        Name = group.Key,
                        Count = group.Count(),
                        Amount = group.Sum(lead => lead.EstimatedAmount ?? 0)
                    })
                    .OrderByDescending(group => group.Amount)
                    .ToListAsync();
            }

            if (groupName == "Temperature")
            {
                return await leadsQuery
                    .GroupBy(lead => lead.Temperature)
                    .Select(group => new ReportGroupResponse
                    {
                        Name = group.Key,
                        Count = group.Count(),
                        Amount = group.Sum(lead => lead.EstimatedAmount ?? 0)
                    })
                    .OrderByDescending(group => group.Amount)
                    .ToListAsync();
            }

            return await leadsQuery
                .GroupBy(lead => lead.Status)
                .Select(group => new ReportGroupResponse
                {
                    Name = group.Key,
                    Count = group.Count(),
                    Amount = group.Sum(lead => lead.EstimatedAmount ?? 0)
                })
                .OrderByDescending(group => group.Amount)
                .ToListAsync();
        }

        private async Task<List<PipelineLeadResponse>> GetUpcomingCloseLeadsAsync(IQueryable<Domain.Entities.Lead> openLeadsQuery)
        {
            return await openLeadsQuery
                .OrderBy(lead => lead.ExpectedCloseDate ?? DateTime.MaxValue)
                .ThenByDescending(lead => lead.Score)
                .Take(10)
                .Select(lead => new PipelineLeadResponse
                {
                    Id = lead.Id,
                    Title = lead.Title,
                    CustomerName = lead.Customer.Name,
                    AssignedUserName = lead.AssignedUser != null ? lead.AssignedUser.FullName : null,
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

        private async Task<List<ReportGroupResponse>> GetCustomersBySourceAsync(IQueryable<Domain.Entities.Customer> customersQuery)
        {
            return await customersQuery
                .GroupBy(customer => customer.Source ?? "Sin origen")
                .Select(group => new ReportGroupResponse
                {
                    Name = group.Key,
                    Count = group.Count(),
                    Amount = 0
                })
                .OrderByDescending(group => group.Count)
                .ToListAsync();
        }

        private async Task<List<ReportGroupResponse>> GetCustomersByProvinceAsync(IQueryable<Domain.Entities.Customer> customersQuery)
        {
            return await customersQuery
                .GroupBy(customer => customer.Province ?? "Sin provincia")
                .Select(group => new ReportGroupResponse
                {
                    Name = group.Key,
                    Count = group.Count(),
                    Amount = 0
                })
                .OrderByDescending(group => group.Count)
                .ToListAsync();
        }

        private async Task<List<CustomerValueResponse>> GetTopCustomersAsync(IQueryable<Domain.Entities.Customer> customersQuery)
        {
            return await customersQuery
                .Select(customer => new CustomerValueResponse
                {
                    CustomerId = customer.Id,
                    CustomerName = customer.Name,
                    LeadsCount = customer.Leads.Count(lead => lead.IsActive),
                    OpenLeadsCount = customer.Leads.Count(lead => lead.IsActive && lead.Status != "Ganado" && lead.Status != "Perdido"),
                    QuotesCount = customer.Quotes.Count(quote => quote.IsActive),
                    AcceptedQuotesCount = customer.Quotes.Count(quote => quote.IsActive && quote.Status == "Aceptada"),
                    PotentialAmount = customer.Leads
                        .Where(lead => lead.IsActive && lead.Status != "Ganado" && lead.Status != "Perdido")
                        .Sum(lead => lead.EstimatedAmount ?? 0),
                    AcceptedAmount = customer.Quotes
                        .Where(quote => quote.IsActive && quote.Status == "Aceptada")
                        .Sum(quote => quote.Total),
                    CreatedAt = customer.CreatedAt
                })
                .OrderByDescending(customer => customer.AcceptedAmount)
                .ThenByDescending(customer => customer.PotentialAmount)
                .ThenByDescending(customer => customer.LeadsCount)
                .Take(10)
                .ToListAsync();
        }

        private int GetCurrentCompanyId()
        {
            return _currentUserService.CompanyId
                ?? throw new UnauthorizedAccessException("No se pudo identificar la empresa del usuario autenticado.");
        }

        private static (DateTime? Start, DateTime? EndInclusive, DateTime? EndExclusive) BuildDateRange(DateTime? from, DateTime? to)
        {
            var start = from?.Date;
            var endInclusive = to?.Date;
            var endExclusive = endInclusive?.AddDays(1);

            return (start, endInclusive, endExclusive);
        }

        private static IQueryable<T> ApplyDateRange<T>(
            IQueryable<T> query,
            DateTime? start,
            DateTime? endExclusive,
            System.Linq.Expressions.Expression<Func<T, DateTime>> dateSelector)
        {
            if (start is not null)
            {
                query = query.Where(BuildDateComparison(dateSelector, start.Value, greaterThanOrEqual: true));
            }

            if (endExclusive is not null)
            {
                query = query.Where(BuildDateComparison(dateSelector, endExclusive.Value, greaterThanOrEqual: false));
            }

            return query;
        }

        private static System.Linq.Expressions.Expression<Func<T, bool>> BuildDateComparison<T>(
            System.Linq.Expressions.Expression<Func<T, DateTime>> dateSelector,
            DateTime value,
            bool greaterThanOrEqual)
        {
            var comparison = greaterThanOrEqual
                ? System.Linq.Expressions.Expression.GreaterThanOrEqual(dateSelector.Body, System.Linq.Expressions.Expression.Constant(value))
                : System.Linq.Expressions.Expression.LessThan(dateSelector.Body, System.Linq.Expressions.Expression.Constant(value));

            return System.Linq.Expressions.Expression.Lambda<Func<T, bool>>(comparison, dateSelector.Parameters);
        }

        private static decimal CalculateRate(int total, int value)
        {
            if (total == 0)
            {
                return 0;
            }

            return Math.Round((decimal)value / total * 100, 2);
        }
    }
}
