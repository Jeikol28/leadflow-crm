using LeadFlow.Application.DTOs.CompanySettings;
using LeadFlow.Application.Common.Validation;
using LeadFlow.Application.Interfaces.AuditLogs;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.CompanySettings;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.CompanySettings
{
    // Servicio de configuracion empresarial con aislamiento por CompanyId del token.
    public class CompanySettingsService : ICompanySettingsService
    {
        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditLogService _auditLogService;

        public CompanySettingsService(
            LeadFlowDbContext context,
            ICurrentUserService currentUserService,
            IAuditLogService auditLogService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _auditLogService = auditLogService;
        }

        public async Task<CompanySettingsResponse?> GetCurrentCompanyAsync()
        {
            var companyId = GetCurrentCompanyId();

            var company = await _context.Companies
                .FirstOrDefaultAsync(company => company.Id == companyId && company.IsActive);

            return company is null ? null : MapToResponse(company);
        }

        public async Task<CompanySettingsResponse?> UpdateCurrentCompanyAsync(UpdateCompanySettingsRequest request)
        {
            var companyId = GetCurrentCompanyId();
            ValidateRequest(request);

            var company = await _context.Companies
                .FirstOrDefaultAsync(company => company.Id == companyId && company.IsActive);

            if (company is null)
            {
                return null;
            }

            company.Name = InputValidator.NormalizeRequiredText(request.Name, "El nombre de la empresa", minLength: 3, maxLength: 150);
            company.LegalName = InputValidator.NormalizeOptionalText(request.LegalName, "La razon social", maxLength: 200);
            company.Email = InputValidator.NormalizeOptionalEmail(request.Email, "El correo de la empresa");
            company.Phone = InputValidator.NormalizeOptionalPhone(request.Phone, "El telefono de la empresa");
            company.IdentificationNumber = InputValidator.NormalizeOptionalText(request.IdentificationNumber, "La identificacion fiscal", maxLength: 40);
            company.Address = InputValidator.NormalizeOptionalText(request.Address, "La direccion de la empresa", maxLength: 300);
            company.Province = InputValidator.NormalizeOptionalText(request.Province, "La provincia de la empresa", maxLength: 80);
            company.Canton = InputValidator.NormalizeOptionalText(request.Canton, "El canton de la empresa", maxLength: 80);
            company.Website = InputValidator.NormalizeOptionalText(request.Website, "El sitio web de la empresa", maxLength: 250);
            company.LogoUrl = InputValidator.NormalizeOptionalText(request.LogoUrl, "El logo de la empresa", maxLength: 500);
            company.DefaultCurrency = InputValidator.NormalizeCurrencyCode(request.DefaultCurrency, "La moneda");
            company.DefaultTaxRate = request.DefaultTaxRate;
            company.QuotePrefix = InputValidator.NormalizeRequiredText(request.QuotePrefix, "El prefijo de cotizacion", minLength: 1, maxLength: 10).ToUpperInvariant();
            company.DefaultQuoteTerms = InputValidator.NormalizeOptionalText(request.DefaultQuoteTerms, "Los terminos por defecto", maxLength: 1000);
            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                "Update",
                "Company",
                company.Id,
                $"Se actualizo la configuracion de empresa {company.Name}.");

            return MapToResponse(company);
        }

        private int GetCurrentCompanyId()
        {
            return _currentUserService.CompanyId
                ?? throw new UnauthorizedAccessException("No se pudo identificar la empresa del usuario autenticado.");
        }

        private static void ValidateRequest(UpdateCompanySettingsRequest request)
        {
            InputValidator.NormalizeRequiredText(request.Name, "El nombre de la empresa", minLength: 3, maxLength: 150);
            InputValidator.NormalizeOptionalText(request.LegalName, "La razon social", maxLength: 200);
            InputValidator.NormalizeOptionalEmail(request.Email, "El correo de la empresa");
            InputValidator.NormalizeOptionalPhone(request.Phone, "El telefono de la empresa");
            InputValidator.NormalizeOptionalText(request.IdentificationNumber, "La identificacion fiscal", maxLength: 40);
            InputValidator.NormalizeOptionalText(request.Address, "La direccion de la empresa", maxLength: 300);
            InputValidator.NormalizeOptionalText(request.Province, "La provincia de la empresa", maxLength: 80);
            InputValidator.NormalizeOptionalText(request.Canton, "El canton de la empresa", maxLength: 80);
            InputValidator.NormalizeOptionalText(request.Website, "El sitio web de la empresa", maxLength: 250);
            InputValidator.NormalizeOptionalText(request.LogoUrl, "El logo de la empresa", maxLength: 500);
            InputValidator.NormalizeCurrencyCode(request.DefaultCurrency, "La moneda");
            InputValidator.ValidatePercentage(request.DefaultTaxRate, "El impuesto por defecto");
            InputValidator.NormalizeRequiredText(request.QuotePrefix, "El prefijo de cotizacion", minLength: 1, maxLength: 10);
            InputValidator.NormalizeOptionalText(request.DefaultQuoteTerms, "Los terminos por defecto", maxLength: 1000);

        }

        private static CompanySettingsResponse MapToResponse(Company company)
        {
            return new CompanySettingsResponse
            {
                Id = company.Id,
                Name = company.Name,
                LegalName = company.LegalName,
                Email = company.Email,
                Phone = company.Phone,
                IdentificationNumber = company.IdentificationNumber,
                Address = company.Address,
                Province = company.Province,
                Canton = company.Canton,
                Website = company.Website,
                LogoUrl = company.LogoUrl,
                DefaultCurrency = company.DefaultCurrency,
                DefaultTaxRate = company.DefaultTaxRate,
                QuotePrefix = company.QuotePrefix,
                DefaultQuoteTerms = company.DefaultQuoteTerms,
                IsActive = company.IsActive,
                CreatedAt = company.CreatedAt,
                UpdatedAt = company.UpdatedAt
            };
        }
    }
}
