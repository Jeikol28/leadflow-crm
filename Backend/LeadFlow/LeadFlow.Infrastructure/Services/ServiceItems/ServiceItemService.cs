using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Services;
using LeadFlow.Application.Common.Validation;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.Services;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.ServiceItems
{
    // Servicio para administrar el catalogo de servicios o productos de cada empresa.
    public class ServiceItemService : IServiceItemService
    {
        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public ServiceItemService(LeadFlowDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<PagedResponse<ServiceResponse>> GetAllAsync(PagedRequest request)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Services
                .Where(service => service.CompanyId == companyId && service.IsActive);

            var totalItems = await query.CountAsync();

            // Devuelve el catalogo por pagina para empresas con muchos servicios o productos.
            var items = await query
                .OrderBy(service => service.Name)
                .Skip(request.Skip)
                .Take(request.ValidPageSize)
                .Select(service => MapToResponse(service))
                .ToListAsync();

            return PagedResponse<ServiceResponse>.Create(items, totalItems, request);
        }

        public async Task<ServiceResponse?> GetByIdAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var service = await _context.Services
                .FirstOrDefaultAsync(service =>
                    service.Id == id &&
                    service.CompanyId == companyId &&
                    service.IsActive);

            return service is null ? null : MapToResponse(service);
        }

        public async Task<ServiceResponse> CreateAsync(CreateServiceRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var name = InputValidator.NormalizeRequiredText(request.Name, "El nombre del servicio", minLength: 2, maxLength: 150);

            ValidatePrice(request.Price);
            await EnsureNameIsAvailableAsync(companyId, name);

            var service = new ServiceItem
            {
                CompanyId = companyId,
                Name = name,
                Description = InputValidator.NormalizeOptionalText(request.Description, "La descripcion del servicio", maxLength: 500),
                Price = request.Price,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Services.Add(service);
            await _context.SaveChangesAsync();

            return MapToResponse(service);
        }

        public async Task<ServiceResponse?> UpdateAsync(int id, UpdateServiceRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var name = InputValidator.NormalizeRequiredText(request.Name, "El nombre del servicio", minLength: 2, maxLength: 150);

            ValidatePrice(request.Price);

            var service = await _context.Services
                .FirstOrDefaultAsync(service =>
                    service.Id == id &&
                    service.CompanyId == companyId &&
                    service.IsActive);

            if (service is null)
            {
                return null;
            }

            await EnsureNameIsAvailableAsync(companyId, name, id);

            service.Name = name;
            service.Description = InputValidator.NormalizeOptionalText(request.Description, "La descripcion del servicio", maxLength: 500);
            service.Price = request.Price;
            service.IsActive = request.IsActive;
            service.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToResponse(service);
        }

        public async Task<bool> DeactivateAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var service = await _context.Services
                .FirstOrDefaultAsync(service =>
                    service.Id == id &&
                    service.CompanyId == companyId &&
                    service.IsActive);

            if (service is null)
            {
                return false;
            }

            service.IsActive = false;
            service.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        private int GetCurrentCompanyId()
        {
            return _currentUserService.CompanyId
                ?? throw new UnauthorizedAccessException("No se pudo identificar la empresa del usuario autenticado.");
        }

        private async Task EnsureNameIsAvailableAsync(int companyId, string name, int? currentServiceId = null)
        {
            var nameExists = await _context.Services
                .AnyAsync(service =>
                    service.CompanyId == companyId &&
                    service.Name == name &&
                    (!currentServiceId.HasValue || service.Id != currentServiceId.Value));

            if (nameExists)
            {
                throw new InvalidOperationException("Ya existe un servicio con ese nombre para esta empresa.");
            }
        }

        private static void ValidatePrice(decimal price)
        {
            InputValidator.ValidateMoney(price, "El precio del servicio");
        }

        private static ServiceResponse MapToResponse(ServiceItem service)
        {
            return new ServiceResponse
            {
                Id = service.Id,
                CompanyId = service.CompanyId,
                Name = service.Name,
                Description = service.Description,
                Price = service.Price,
                IsActive = service.IsActive,
                CreatedAt = service.CreatedAt,
                UpdatedAt = service.UpdatedAt
            };
        }
    }
}
