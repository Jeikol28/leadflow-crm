//Este servicio administra los estados del pipeline para la empresa autenticada.

using LeadFlow.Application.DTOs.LeadStatuses;
using LeadFlow.Application.Common.Validation;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.LeadStatuses;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.LeadStatuses
{
    // Servicio para administrar estados personalizables del pipeline por empresa.
    public class LeadStatusService : ILeadStatusService
    {
        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public LeadStatusService(LeadFlowDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<List<LeadStatusResponse>> GetAllAsync()
        {
            var companyId = GetCurrentCompanyId();

            return await _context.LeadStatuses
                .Where(status => status.CompanyId == companyId && status.IsActive)
                .OrderBy(status => status.SortOrder)
                .Select(status => MapToResponse(status))
                .ToListAsync();
        }

        public async Task<LeadStatusResponse?> GetByIdAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var status = await _context.LeadStatuses
                .FirstOrDefaultAsync(status =>
                    status.Id == id &&
                    status.CompanyId == companyId &&
                    status.IsActive);

            return status is null ? null : MapToResponse(status);
        }

        public async Task<LeadStatusResponse> CreateAsync(CreateLeadStatusRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var name = InputValidator.NormalizeRequiredText(request.Name, "El nombre del estado", minLength: 2, maxLength: 80);
            var description = InputValidator.NormalizeOptionalText(request.Description, "La descripcion del estado", maxLength: 300);
            var color = NormalizeColor(request.Color);

            ValidateStatusInput(name, color, request.SortOrder, request.IsWon, request.IsLost);

            var nameExists = await _context.LeadStatuses
                .AnyAsync(status =>
                    status.CompanyId == companyId &&
                    status.Name == name);

            if (nameExists)
            {
                throw new InvalidOperationException("Ya existe un estado con ese nombre para esta empresa.");
            }

            var status = new LeadStatus
            {
                CompanyId = companyId,
                Name = name,
                Description = description,
                Color = color,
                SortOrder = request.SortOrder,
                IsWon = request.IsWon,
                IsLost = request.IsLost,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.LeadStatuses.Add(status);
            await _context.SaveChangesAsync();

            return MapToResponse(status);
        }

        public async Task<LeadStatusResponse?> UpdateAsync(int id, UpdateLeadStatusDefinitionRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var name = InputValidator.NormalizeRequiredText(request.Name, "El nombre del estado", minLength: 2, maxLength: 80);
            var description = InputValidator.NormalizeOptionalText(request.Description, "La descripcion del estado", maxLength: 300);
            var color = NormalizeColor(request.Color);

            ValidateStatusInput(name, color, request.SortOrder, request.IsWon, request.IsLost);

            var status = await _context.LeadStatuses
                .FirstOrDefaultAsync(status =>
                    status.Id == id &&
                    status.CompanyId == companyId);

            if (status is null)
            {
                return null;
            }

            var nameExists = await _context.LeadStatuses
                .AnyAsync(item =>
                    item.CompanyId == companyId &&
                    item.Id != id &&
                    item.Name == name);

            if (nameExists)
            {
                throw new InvalidOperationException("Ya existe otro estado con ese nombre para esta empresa.");
            }

            status.Name = name;
            status.Description = description;
            status.Color = color;
            status.SortOrder = request.SortOrder;
            status.IsWon = request.IsWon;
            status.IsLost = request.IsLost;
            status.IsActive = request.IsActive;
            status.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToResponse(status);
        }

        public async Task<bool> DeactivateAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var status = await _context.LeadStatuses
                .FirstOrDefaultAsync(status =>
                    status.Id == id &&
                    status.CompanyId == companyId &&
                    status.IsActive);

            if (status is null)
            {
                return false;
            }

            status.IsActive = false;
            status.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        private int GetCurrentCompanyId()
        {
            return _currentUserService.CompanyId
                ?? throw new UnauthorizedAccessException("No se pudo identificar la empresa del usuario autenticado.");
        }

        private static void ValidateStatusInput(string name, string color, int sortOrder, bool isWon, bool isLost)
        {
            InputValidator.NormalizeRequiredText(name, "El nombre del estado", minLength: 2, maxLength: 80);

            if (sortOrder < 1 || sortOrder > 1000)
            {
                throw new InvalidOperationException("El orden del estado debe estar entre 1 y 1000.");
            }

            ValidateColor(color);

            if (isWon && isLost)
            {
                throw new InvalidOperationException("Un estado no puede ser ganado y perdido al mismo tiempo.");
            }
        }

        private static string NormalizeColor(string? color)
        {
            if (string.IsNullOrWhiteSpace(color))
            {
                return "#64748B";
            }

            var normalizedColor = color.Trim().ToUpperInvariant();
            ValidateColor(normalizedColor);

            return normalizedColor;
        }

        private static void ValidateColor(string color)
        {
            var isValidHexColor =
                color.Length == 7 &&
                color.StartsWith("#", StringComparison.Ordinal) &&
                color.Skip(1).All(Uri.IsHexDigit);

            if (!isValidHexColor)
            {
                throw new InvalidOperationException("El color del estado debe tener formato hexadecimal, por ejemplo #2563EB.");
            }
        }

        private static LeadStatusResponse MapToResponse(LeadStatus status)
        {
            return new LeadStatusResponse
            {
                Id = status.Id,
                CompanyId = status.CompanyId,
                Name = status.Name,
                Description = status.Description,
                Color = status.Color,
                SortOrder = status.SortOrder,
                IsWon = status.IsWon,
                IsLost = status.IsLost,
                IsActive = status.IsActive,
                CreatedAt = status.CreatedAt,
                UpdatedAt = status.UpdatedAt
            };
        }
    }
}
