// Este servicio maneja la logica de oportunidades comerciales.
// Aplica seguridad multiempresa, valida clientes/usuarios/estados y calcula lead scoring.

using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Leads;
using LeadFlow.Application.Common.Validation;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.Leads;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.Leads
{
    // Servicio de leads con filtro multiempresa, soft delete y calculo basico de lead scoring.
    public class LeadService : ILeadService
    {
        private static readonly string[] AllowedPriorities =
        [
            "Baja",
            "Media",
            "Alta"
        ];

        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public LeadService(LeadFlowDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<PagedResponse<LeadResponse>> GetAllAsync(PagedRequest request)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Leads
                .Include(lead => lead.Customer)
                .Include(lead => lead.AssignedUser)
                .Where(lead => lead.CompanyId == companyId && lead.IsActive);

            query = ApplyLeadScope(query);

            var totalItems = await query.CountAsync();

            // Devuelve solo la pagina solicitada para mantener rapido el pipeline con muchos leads.
            var items = await query
                .OrderByDescending(lead => lead.CreatedAt)
                .Skip(request.Skip)
                .Take(request.ValidPageSize)
                .Select(lead => MapToResponse(lead))
                .ToListAsync();

            return PagedResponse<LeadResponse>.Create(items, totalItems, request);
        }

        public async Task<LeadResponse?> GetByIdAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Leads
                .Include(lead => lead.Customer)
                .Include(lead => lead.AssignedUser)
                .Where(lead =>
                    lead.Id == id &&
                    lead.CompanyId == companyId &&
                    lead.IsActive);

            query = ApplyLeadScope(query);

            var lead = await query.FirstOrDefaultAsync();

            return lead is null ? null : MapToResponse(lead);
        }

        public async Task<LeadResponse> CreateAsync(CreateLeadRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var assignedUserId = ResolveAssignedUserIdForWrite(request.AssignedUserId);
            var title = InputValidator.NormalizeRequiredText(request.Title, "El titulo del lead", minLength: 3, maxLength: 200);
            var priority = InputValidator.NormalizeRequiredText(request.Priority, "La prioridad del lead", maxLength: 50);

            ValidateLeadInput(
                title,
                priority,
                request.EstimatedAmount,
                request.CloseProbability,
                request.ExpectedCloseDate,
                lastContactedAt: null);

            await EnsureStatusExistsAsync(companyId, request.Status);

            var customerExists = await _context.Customers
                .AnyAsync(customer =>
                    customer.Id == request.CustomerId &&
                    customer.CompanyId == companyId &&
                    customer.IsActive);

            if (!customerExists)
            {
                throw new InvalidOperationException("El cliente no existe o no pertenece a la empresa autenticada.");
            }

            if (assignedUserId.HasValue)
            {
                var userExists = await _context.Users
                    .AnyAsync(user =>
                        user.Id == assignedUserId.Value &&
                        user.CompanyId == companyId &&
                        user.IsActive);

                if (!userExists)
                {
                    throw new InvalidOperationException("El usuario asignado no existe o no pertenece a la empresa autenticada.");
                }
            }

            var lead = new Lead
            {
                CompanyId = companyId,
                CustomerId = request.CustomerId,
                AssignedUserId = assignedUserId,
                Title = title,
                Description = InputValidator.NormalizeOptionalText(request.Description, "La descripcion del lead", maxLength: 1000),
                Status = request.Status.Trim(),
                Priority = priority,
                EstimatedAmount = request.EstimatedAmount,
                CloseProbability = request.CloseProbability,
                ExpectedCloseDate = request.ExpectedCloseDate,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            ApplyLeadScoring(lead);

            _context.Leads.Add(lead);
            await _context.SaveChangesAsync();

            await LoadLeadRelationsAsync(lead);

            return MapToResponse(lead);
        }

        public async Task<LeadResponse?> UpdateAsync(int id, UpdateLeadRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var title = InputValidator.NormalizeRequiredText(request.Title, "El titulo del lead", minLength: 3, maxLength: 200);
            var priority = InputValidator.NormalizeRequiredText(request.Priority, "La prioridad del lead", maxLength: 50);

            ValidateLeadInput(
                title,
                priority,
                request.EstimatedAmount,
                request.CloseProbability,
                request.ExpectedCloseDate,
                request.LastContactedAt);

            await EnsureStatusExistsAsync(companyId, request.Status);

            var assignedUserId = ResolveAssignedUserIdForWrite(request.AssignedUserId);

            var query = _context.Leads
                .Where(lead =>
                    lead.Id == id &&
                    lead.CompanyId == companyId &&
                    lead.IsActive);

            query = ApplyLeadScope(query);

            var lead = await query.FirstOrDefaultAsync();

            if (lead is null)
            {
                return null;
            }

            var customerExists = await _context.Customers
                .AnyAsync(customer =>
                    customer.Id == request.CustomerId &&
                    customer.CompanyId == companyId &&
                    customer.IsActive);

            if (!customerExists)
            {
                throw new InvalidOperationException("El cliente no existe o no pertenece a la empresa autenticada.");
            }

            if (assignedUserId.HasValue)
            {
                var userExists = await _context.Users
                    .AnyAsync(user =>
                        user.Id == assignedUserId.Value &&
                        user.CompanyId == companyId &&
                        user.IsActive);

                if (!userExists)
                {
                    throw new InvalidOperationException("El usuario asignado no existe o no pertenece a la empresa autenticada.");
                }
            }

            lead.CustomerId = request.CustomerId;
            lead.AssignedUserId = assignedUserId;
            lead.Title = title;
            lead.Description = InputValidator.NormalizeOptionalText(request.Description, "La descripcion del lead", maxLength: 1000);
            lead.Status = request.Status.Trim();
            lead.Priority = priority;
            lead.EstimatedAmount = request.EstimatedAmount;
            lead.CloseProbability = request.CloseProbability;
            lead.ExpectedCloseDate = request.ExpectedCloseDate;
            lead.LastContactedAt = request.LastContactedAt;
            lead.UpdatedAt = DateTime.UtcNow;

            ApplyLeadScoring(lead);

            await _context.SaveChangesAsync();

            await LoadLeadRelationsAsync(lead);

            return MapToResponse(lead);
        }

        public async Task<LeadResponse?> UpdateStatusAsync(int id, UpdateLeadStatusRequest request)
        {
            var companyId = GetCurrentCompanyId();

            if (string.IsNullOrWhiteSpace(request.Status))
            {
                throw new InvalidOperationException("El estado del lead es requerido.");
            }

            await EnsureStatusExistsAsync(companyId, request.Status);

            var query = _context.Leads
                .Where(lead =>
                    lead.Id == id &&
                    lead.CompanyId == companyId &&
                    lead.IsActive);

            query = ApplyLeadScope(query);

            var lead = await query.FirstOrDefaultAsync();

            if (lead is null)
            {
                return null;
            }

            lead.Status = request.Status.Trim();
            lead.UpdatedAt = DateTime.UtcNow;

            ApplyLeadScoring(lead);

            await _context.SaveChangesAsync();

            await LoadLeadRelationsAsync(lead);

            return MapToResponse(lead);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Leads
                .Where(lead =>
                    lead.Id == id &&
                    lead.CompanyId == companyId &&
                    lead.IsActive);

            query = ApplyLeadScope(query);

            var lead = await query.FirstOrDefaultAsync();

            if (lead is null)
            {
                return false;
            }

            lead.IsActive = false;
            lead.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

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

        private IQueryable<Lead> ApplyLeadScope(IQueryable<Lead> query)
        {
            if (CanManageCompanyScope())
            {
                return query;
            }

            var userId = GetCurrentUserId();
            return query.Where(lead => lead.AssignedUserId == userId);
        }

        private int? ResolveAssignedUserIdForWrite(int? requestedAssignedUserId)
        {
            if (CanManageCompanyScope())
            {
                return requestedAssignedUserId;
            }

            var currentUserId = GetCurrentUserId();

            if (requestedAssignedUserId.HasValue && requestedAssignedUserId.Value != currentUserId)
            {
                throw new InvalidOperationException("Solo puedes asignar leads a tu propio usuario.");
            }

            return currentUserId;
        }

        private async Task EnsureStatusExistsAsync(int companyId, string statusName)
        {
            if (string.IsNullOrWhiteSpace(statusName))
            {
                throw new InvalidOperationException("El estado del lead es requerido.");
            }

            var normalizedStatusName = statusName.Trim();

            var statusExists = await _context.LeadStatuses
                .AnyAsync(status =>
                    status.CompanyId == companyId &&
                    status.Name == normalizedStatusName &&
                    status.IsActive);

            if (!statusExists)
            {
                throw new InvalidOperationException("El estado del lead no existe o no esta activo para esta empresa.");
            }
        }

        private static void ValidateLeadInput(
            string title,
            string priority,
            decimal? estimatedAmount,
            int closeProbability,
            DateTime? expectedCloseDate,
            DateTime? lastContactedAt)
        {
            InputValidator.NormalizeRequiredText(title, "El titulo del lead", minLength: 3, maxLength: 200);

            if (!AllowedPriorities.Contains(priority.Trim()))
            {
                throw new InvalidOperationException("La prioridad debe ser Baja, Media o Alta.");
            }

            InputValidator.ValidateMoney(estimatedAmount, "El monto estimado del lead");

            InputValidator.ValidatePercentage(closeProbability, "La probabilidad de cierre");

            InputValidator.ValidateNotInFuture(lastContactedAt, "La fecha de ultimo contacto");
            InputValidator.ValidateNotTooOld(expectedCloseDate, "La fecha esperada de cierre");
        }

        private static void ApplyLeadScoring(Lead lead)
        {
            var score = 0;

            if (lead.EstimatedAmount.HasValue && lead.EstimatedAmount.Value >= 1000000)
            {
                score += 20;
            }

            if (lead.Status == "Negociacion")
            {
                score += 20;
            }

            if (lead.Priority == "Alta")
            {
                score += 15;
            }

            if (lead.LastContactedAt.HasValue &&
                lead.LastContactedAt.Value >= DateTime.UtcNow.AddDays(-7))
            {
                score += 15;
            }

            if (lead.LastContactedAt.HasValue &&
                lead.LastContactedAt.Value < DateTime.UtcNow.AddDays(-7))
            {
                score -= 15;
            }

            score += Math.Clamp(lead.CloseProbability, 0, 100) / 5;

            lead.Score = Math.Clamp(score, 0, 100);

            lead.Temperature = lead.Score switch
            {
                >= 70 => "Caliente",
                >= 40 => "Medio",
                _ => "Frio"
            };
        }

        private async Task LoadLeadRelationsAsync(Lead lead)
        {
            await _context.Entry(lead)
                .Reference(item => item.Customer)
                .LoadAsync();

            await _context.Entry(lead)
                .Reference(item => item.AssignedUser)
                .LoadAsync();
        }

        private static LeadResponse MapToResponse(Lead lead)
        {
            return new LeadResponse
            {
                Id = lead.Id,
                CompanyId = lead.CompanyId,
                CustomerId = lead.CustomerId,
                CustomerName = lead.Customer.Name,
                AssignedUserId = lead.AssignedUserId,
                AssignedUserName = lead.AssignedUser?.FullName,
                Title = lead.Title,
                Description = lead.Description,
                Status = lead.Status,
                Priority = lead.Priority,
                EstimatedAmount = lead.EstimatedAmount,
                CloseProbability = lead.CloseProbability,
                Score = lead.Score,
                Temperature = lead.Temperature,
                IsActive = lead.IsActive,
                ExpectedCloseDate = lead.ExpectedCloseDate,
                LastContactedAt = lead.LastContactedAt,
                CreatedAt = lead.CreatedAt,
                UpdatedAt = lead.UpdatedAt
            };
        }
    }
}
