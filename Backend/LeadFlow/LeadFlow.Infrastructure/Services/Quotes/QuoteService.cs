using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Quotes;
using LeadFlow.Application.Common.Validation;
using LeadFlow.Application.Interfaces.AuditLogs;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.Quotes;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.Quotes
{
    // Servicio de cotizaciones con calculo de totales, IVA y seguridad multiempresa.
    public class QuoteService : IQuoteService
    {
        private static readonly string[] AllowedStatuses =
        [
            "Borrador",
            "Enviada",
            "Aceptada",
            "Rechazada"
        ];

        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditLogService _auditLogService;

        public QuoteService(
            LeadFlowDbContext context,
            ICurrentUserService currentUserService,
            IAuditLogService auditLogService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _auditLogService = auditLogService;
        }

        public async Task<PagedResponse<QuoteResponse>> GetAllAsync(PagedRequest request)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Quotes
                .Include(quote => quote.Customer)
                .Include(quote => quote.Lead)
                .Include(quote => quote.CreatedByUser)
                .Include(quote => quote.Items)
                .Where(quote => quote.CompanyId == companyId && quote.IsActive);

            query = ApplyQuoteScope(query);

            var totalItems = await query.CountAsync();

            // Devuelve cotizaciones por pagina para proteger rendimiento en historiales comerciales grandes.
            var items = await query
                .OrderByDescending(quote => quote.CreatedAt)
                .Skip(request.Skip)
                .Take(request.ValidPageSize)
                .Select(quote => MapToResponse(quote))
                .ToListAsync();

            return PagedResponse<QuoteResponse>.Create(items, totalItems, request);
        }

        public async Task<QuoteResponse?> GetByIdAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Quotes
                .Include(quote => quote.Customer)
                .Include(quote => quote.Lead)
                .Include(quote => quote.CreatedByUser)
                .Include(quote => quote.Items)
                .Where(quote =>
                    quote.Id == id &&
                    quote.CompanyId == companyId &&
                    quote.IsActive);

            query = ApplyQuoteScope(query);

            var quote = await query.FirstOrDefaultAsync();

            return quote is null ? null : MapToResponse(quote);
        }

        public async Task<QuoteResponse> CreateAsync(CreateQuoteRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var userId = GetCurrentUserId();
            var status = InputValidator.NormalizeRequiredText(request.Status, "El estado de la cotizacion", maxLength: 50);
            var currency = InputValidator.NormalizeCurrencyCode(request.Currency, "La moneda de la cotizacion");

            ValidateQuoteInput(
                request.Items.Count,
                request.DiscountAmount,
                request.TaxRate,
                currency,
                status,
                request.ExpirationDate,
                request.Notes,
                request.Terms);
            await EnsureCustomerBelongsToCompanyAsync(request.CustomerId, companyId);

            if (request.LeadId.HasValue)
            {
                await EnsureLeadBelongsToCompanyAsync(request.LeadId.Value, request.CustomerId, companyId);
                await EnsureLeadIsAllowedForCurrentUserAsync(request.LeadId.Value, companyId);
            }

            var quote = new Quote
            {
                CompanyId = companyId,
                CustomerId = request.CustomerId,
                LeadId = request.LeadId,
                CreatedByUserId = userId,
                QuoteNumber = await GenerateQuoteNumberAsync(companyId),
                Status = status,
                Currency = currency,
                DiscountAmount = request.DiscountAmount,
                TaxRate = request.TaxRate,
                IssueDate = DateTime.UtcNow,
                ExpirationDate = request.ExpirationDate,
                Notes = InputValidator.NormalizeOptionalText(request.Notes, "Las notas de la cotizacion", maxLength: 1000),
                Terms = InputValidator.NormalizeOptionalText(request.Terms, "Los terminos de la cotizacion", maxLength: 1000),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var itemRequest in request.Items)
            {
                quote.Items.Add(await BuildQuoteItemAsync(itemRequest, companyId));
            }

            RecalculateTotals(quote);
            ApplyStatusDates(quote, quote.Status);

            _context.Quotes.Add(quote);
            await _context.SaveChangesAsync();

            await ApplyLeadStatusFromQuoteAsync(quote);
            await LoadQuoteRelationsAsync(quote);

            await _auditLogService.LogAsync(
                "Create",
                "Quote",
                quote.Id,
                $"Se creo la cotizacion {quote.QuoteNumber} por {quote.Total} {quote.Currency}.");

            return MapToResponse(quote);
        }

        public async Task<QuoteResponse?> UpdateAsync(int id, UpdateQuoteRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var status = InputValidator.NormalizeRequiredText(request.Status, "El estado de la cotizacion", maxLength: 50);
            var currency = InputValidator.NormalizeCurrencyCode(request.Currency, "La moneda de la cotizacion");

            ValidateQuoteInput(
                request.Items.Count,
                request.DiscountAmount,
                request.TaxRate,
                currency,
                status,
                request.ExpirationDate,
                request.Notes,
                request.Terms);

            var query = _context.Quotes
                .Include(quote => quote.Items)
                .Where(quote =>
                    quote.Id == id &&
                    quote.CompanyId == companyId &&
                    quote.IsActive);

            query = ApplyQuoteScope(query);

            var quote = await query.FirstOrDefaultAsync();

            if (quote is null)
            {
                return null;
            }

            await EnsureCustomerBelongsToCompanyAsync(request.CustomerId, companyId);

            if (request.LeadId.HasValue)
            {
                await EnsureLeadBelongsToCompanyAsync(request.LeadId.Value, request.CustomerId, companyId);
                await EnsureLeadIsAllowedForCurrentUserAsync(request.LeadId.Value, companyId);
            }

            quote.CustomerId = request.CustomerId;
            quote.LeadId = request.LeadId;
            quote.Status = status;
            quote.Currency = currency;
            quote.DiscountAmount = request.DiscountAmount;
            quote.TaxRate = request.TaxRate;
            quote.ExpirationDate = request.ExpirationDate;
            quote.Notes = InputValidator.NormalizeOptionalText(request.Notes, "Las notas de la cotizacion", maxLength: 1000);
            quote.Terms = InputValidator.NormalizeOptionalText(request.Terms, "Los terminos de la cotizacion", maxLength: 1000);
            quote.UpdatedAt = DateTime.UtcNow;

            _context.QuoteItems.RemoveRange(quote.Items);
            quote.Items.Clear();

            foreach (var itemRequest in request.Items)
            {
                quote.Items.Add(await BuildQuoteItemAsync(itemRequest, companyId));
            }

            RecalculateTotals(quote);
            ApplyStatusDates(quote, quote.Status);

            await _context.SaveChangesAsync();

            await ApplyLeadStatusFromQuoteAsync(quote);
            await LoadQuoteRelationsAsync(quote);

            await _auditLogService.LogAsync(
                "Update",
                "Quote",
                quote.Id,
                $"Se actualizo la cotizacion {quote.QuoteNumber} por {quote.Total} {quote.Currency}.");

            return MapToResponse(quote);
        }

        public async Task<QuoteResponse?> UpdateStatusAsync(int id, UpdateQuoteStatusRequest request)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Quotes
                .Include(quote => quote.Items)
                .Where(quote =>
                    quote.Id == id &&
                    quote.CompanyId == companyId &&
                    quote.IsActive);

            query = ApplyQuoteScope(query);

            var quote = await query.FirstOrDefaultAsync();

            if (quote is null)
            {
                return null;
            }

            ValidateQuoteStatus(request.Status);

            quote.Status = request.Status.Trim();
            quote.UpdatedAt = DateTime.UtcNow;

            ApplyStatusDates(quote, request.Status);

            await _context.SaveChangesAsync();

            await ApplyLeadStatusFromQuoteAsync(quote);
            await LoadQuoteRelationsAsync(quote);

            await _auditLogService.LogAsync(
                "ChangeStatus",
                "Quote",
                quote.Id,
                $"Se cambio la cotizacion {quote.QuoteNumber} al estado {quote.Status}.");

            return MapToResponse(quote);
        }

        public async Task<bool> DeactivateAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Quotes
                .Where(quote =>
                    quote.Id == id &&
                    quote.CompanyId == companyId &&
                    quote.IsActive);

            query = ApplyQuoteScope(query);

            var quote = await query.FirstOrDefaultAsync();

            if (quote is null)
            {
                return false;
            }

            quote.IsActive = false;
            quote.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                "Deactivate",
                "Quote",
                quote.Id,
                $"Se desactivo la cotizacion {quote.QuoteNumber}.");

            return true;
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

        private IQueryable<Quote> ApplyQuoteScope(IQueryable<Quote> query)
        {
            if (CanManageCompanyScope())
            {
                return query;
            }

            var userId = GetCurrentUserId();

            return query.Where(quote =>
                quote.CreatedByUserId == userId ||
                (quote.Lead != null && quote.Lead.AssignedUserId == userId));
        }

        private static void ValidateQuoteInput(
            int itemCount,
            decimal discountAmount,
            decimal taxRate,
            string currency,
            string status,
            DateTime? expirationDate,
            string? notes,
            string? terms)
        {
            if (itemCount == 0)
            {
                throw new InvalidOperationException("La cotizacion debe tener al menos un item.");
            }

            if (itemCount > 50)
            {
                throw new InvalidOperationException("La cotizacion no puede tener mas de 50 items.");
            }

            InputValidator.ValidateMoney(discountAmount, "El descuento");

            InputValidator.ValidatePercentage(taxRate, "El porcentaje de impuesto");
            InputValidator.NormalizeCurrencyCode(currency, "La moneda de la cotizacion");

            ValidateQuoteStatus(status);

            InputValidator.ValidateNotTooOld(expirationDate, "La fecha de vencimiento de la cotizacion");
            InputValidator.NormalizeOptionalText(notes, "Las notas de la cotizacion", maxLength: 1000);
            InputValidator.NormalizeOptionalText(terms, "Los terminos de la cotizacion", maxLength: 1000);
        }

        private static void ValidateQuoteStatus(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                throw new InvalidOperationException("El estado de la cotizacion es requerido.");
            }

            if (!AllowedStatuses.Contains(status.Trim()))
            {
                throw new InvalidOperationException("El estado de la cotizacion debe ser Borrador, Enviada, Aceptada o Rechazada.");
            }
        }

        private async Task EnsureCustomerBelongsToCompanyAsync(int customerId, int companyId)
        {
            var customerExists = await _context.Customers
                .AnyAsync(customer =>
                    customer.Id == customerId &&
                    customer.CompanyId == companyId &&
                    customer.IsActive);

            if (!customerExists)
            {
                throw new InvalidOperationException("El cliente no existe o no pertenece a la empresa autenticada.");
            }
        }

        private async Task EnsureLeadBelongsToCompanyAsync(int leadId, int customerId, int companyId)
        {
            var leadExists = await _context.Leads
                .AnyAsync(lead =>
                    lead.Id == leadId &&
                    lead.CustomerId == customerId &&
                    lead.CompanyId == companyId &&
                    lead.IsActive);

            if (!leadExists)
            {
                throw new InvalidOperationException("El lead no existe, no pertenece al cliente indicado o no pertenece a la empresa autenticada.");
            }
        }

        private async Task EnsureLeadIsAllowedForCurrentUserAsync(int leadId, int companyId)
        {
            if (CanManageCompanyScope())
            {
                return;
            }

            var userId = GetCurrentUserId();

            var leadIsAssignedToUser = await _context.Leads
                .AnyAsync(lead =>
                    lead.Id == leadId &&
                    lead.CompanyId == companyId &&
                    lead.AssignedUserId == userId &&
                    lead.IsActive);

            if (!leadIsAssignedToUser)
            {
                throw new InvalidOperationException("Solo puedes cotizar leads asignados a tu usuario.");
            }
        }

        private async Task<QuoteItem> BuildQuoteItemAsync(CreateQuoteItemRequest request, int companyId)
        {
            return await BuildQuoteItemAsync(request.ServiceId, request.Description, request.Quantity, request.UnitPrice, companyId);
        }

        private async Task<QuoteItem> BuildQuoteItemAsync(UpdateQuoteItemRequest request, int companyId)
        {
            return await BuildQuoteItemAsync(request.ServiceId, request.Description, request.Quantity, request.UnitPrice, companyId);
        }

        private async Task<QuoteItem> BuildQuoteItemAsync(int? serviceId, string? description, decimal quantity, decimal? unitPrice, int companyId)
        {
            if (quantity <= 0)
            {
                throw new InvalidOperationException("La cantidad de cada item debe ser mayor que cero.");
            }

            if (quantity > 999999)
            {
                throw new InvalidOperationException("La cantidad de cada item es demasiado alta.");
            }

            InputValidator.ValidateMoney(unitPrice, "El precio unitario");

            ServiceItem? service = null;

            if (serviceId.HasValue)
            {
                service = await _context.Services
                    .FirstOrDefaultAsync(item =>
                        item.Id == serviceId.Value &&
                        item.CompanyId == companyId &&
                        item.IsActive);

                if (service is null)
                {
                    throw new InvalidOperationException("El servicio no existe o no pertenece a la empresa autenticada.");
                }
            }

            var finalDescription = !string.IsNullOrWhiteSpace(description)
                ? description.Trim()
                : service?.Name;

            finalDescription = InputValidator.NormalizeRequiredText(
                finalDescription,
                "La descripcion del item",
                minLength: 2,
                maxLength: 300);

            var finalUnitPrice = unitPrice ?? service?.Price ?? 0;
            var subtotal = quantity * finalUnitPrice;

            return new QuoteItem
            {
                ServiceId = serviceId,
                Description = finalDescription,
                Quantity = quantity,
                UnitPrice = finalUnitPrice,
                Subtotal = subtotal,
                CreatedAt = DateTime.UtcNow
            };
        }

        private async Task<string> GenerateQuoteNumberAsync(int companyId)
        {
            var year = DateTime.UtcNow.Year;
            var company = await _context.Companies
                .FirstOrDefaultAsync(company => company.Id == companyId && company.IsActive);

            var quotePrefix = string.IsNullOrWhiteSpace(company?.QuotePrefix)
                ? "LF"
                : company.QuotePrefix;

            var prefix = $"{quotePrefix}-{year}-";

            var count = await _context.Quotes
                .CountAsync(quote =>
                    quote.CompanyId == companyId &&
                    quote.QuoteNumber.StartsWith(prefix));

            return $"{prefix}{count + 1:0000}";
        }

        private static void RecalculateTotals(Quote quote)
        {
            quote.Subtotal = quote.Items.Sum(item => item.Subtotal);

            if (quote.DiscountAmount > quote.Subtotal)
            {
                throw new InvalidOperationException("El descuento no puede ser mayor al subtotal.");
            }

            var taxableBase = quote.Subtotal - quote.DiscountAmount;
            quote.TaxAmount = taxableBase * quote.TaxRate / 100;
            quote.Total = taxableBase + quote.TaxAmount;
        }

        private static void ApplyStatusDates(Quote quote, string status)
        {
            if (status == "Enviada" && !quote.SentAt.HasValue)
            {
                quote.SentAt = DateTime.UtcNow;
            }

            if (status == "Aceptada" && !quote.AcceptedAt.HasValue)
            {
                quote.AcceptedAt = DateTime.UtcNow;
                quote.RejectedAt = null;
            }

            if (status == "Rechazada" && !quote.RejectedAt.HasValue)
            {
                quote.RejectedAt = DateTime.UtcNow;
                quote.AcceptedAt = null;
            }
        }

        private async Task ApplyLeadStatusFromQuoteAsync(Quote quote)
        {
            if (!quote.LeadId.HasValue)
            {
                return;
            }

            var lead = await _context.Leads
                .FirstOrDefaultAsync(lead =>
                    lead.Id == quote.LeadId.Value &&
                    lead.CompanyId == quote.CompanyId &&
                    lead.IsActive);

            if (lead is null)
            {
                return;
            }

            if (quote.Status == "Aceptada")
            {
                lead.Status = "Ganado";
                lead.CloseProbability = 100;
                lead.UpdatedAt = DateTime.UtcNow;
            }

            if (quote.Status == "Rechazada")
            {
                lead.Status = "Perdido";
                lead.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        private async Task LoadQuoteRelationsAsync(Quote quote)
        {
            await _context.Entry(quote)
                .Reference(item => item.Customer)
                .LoadAsync();

            await _context.Entry(quote)
                .Reference(item => item.Lead)
                .LoadAsync();

            await _context.Entry(quote)
                .Reference(item => item.CreatedByUser)
                .LoadAsync();

            await _context.Entry(quote)
                .Collection(item => item.Items)
                .LoadAsync();
        }

        private static QuoteResponse MapToResponse(Quote quote)
        {
            return new QuoteResponse
            {
                Id = quote.Id,
                CompanyId = quote.CompanyId,
                CustomerId = quote.CustomerId,
                CustomerName = quote.Customer.Name,
                LeadId = quote.LeadId,
                LeadTitle = quote.Lead?.Title,
                CreatedByUserId = quote.CreatedByUserId,
                CreatedByUserName = quote.CreatedByUser.FullName,
                QuoteNumber = quote.QuoteNumber,
                Status = quote.Status,
                Currency = quote.Currency,
                Subtotal = quote.Subtotal,
                DiscountAmount = quote.DiscountAmount,
                TaxRate = quote.TaxRate,
                TaxAmount = quote.TaxAmount,
                Total = quote.Total,
                IssueDate = quote.IssueDate,
                ExpirationDate = quote.ExpirationDate,
                Notes = quote.Notes,
                Terms = quote.Terms,
                IsActive = quote.IsActive,
                CreatedAt = quote.CreatedAt,
                UpdatedAt = quote.UpdatedAt,
                SentAt = quote.SentAt,
                AcceptedAt = quote.AcceptedAt,
                RejectedAt = quote.RejectedAt,
                Items = quote.Items.Select(item => new QuoteItemResponse
                {
                    Id = item.Id,
                    QuoteId = item.QuoteId,
                    ServiceId = item.ServiceId,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    Subtotal = item.Subtotal,
                    CreatedAt = item.CreatedAt
                }).ToList()
            };
        }
    }
}
