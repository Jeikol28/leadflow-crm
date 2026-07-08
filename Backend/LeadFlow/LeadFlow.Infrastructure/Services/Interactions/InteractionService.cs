//Este servicio gestiona el historial de interacciones y valida multiempresa
//-La interacción pertenece a la empresa autenticada.
//-El cliente, si viene, pertenece a la empresa.
//-El lead, si viene, pertenece a la empresa.
//-El usuario viene desde el token.

using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Interactions;
using LeadFlow.Application.Common.Validation;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.Interactions;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.Interactions
{
    // Servicio de interacciones con validacion multiempresa para clientes, leads y usuarios.
    public class InteractionService : IInteractionService
    {
        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public InteractionService(LeadFlowDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<PagedResponse<InteractionResponse>> GetAllAsync(PagedRequest request)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Interactions
                .Include(interaction => interaction.Customer)
                .Include(interaction => interaction.Lead)
                .Include(interaction => interaction.User)
                .Where(interaction => interaction.CompanyId == companyId && interaction.IsActive);

            var totalItems = await query.CountAsync();

            // Devuelve interacciones por pagina para proteger historiales comerciales extensos.
            var items = await query
                .OrderByDescending(interaction => interaction.InteractionDate)
                .Skip(request.Skip)
                .Take(request.ValidPageSize)
                .Select(interaction => MapToResponse(interaction))
                .ToListAsync();

            return PagedResponse<InteractionResponse>.Create(items, totalItems, request);
        }

        public async Task<PagedResponse<InteractionResponse>> GetByCustomerAsync(int customerId, PagedRequest request)
        {
            var companyId = GetCurrentCompanyId();

            var customerExists = await _context.Customers
                .AnyAsync(customer =>
                    customer.Id == customerId &&
                    customer.CompanyId == companyId &&
                    customer.IsActive);

            if (!customerExists)
            {
                throw new InvalidOperationException("El cliente no existe o no pertenece a la empresa autenticada.");
            }

            var query = _context.Interactions
                .Include(interaction => interaction.Customer)
                .Include(interaction => interaction.Lead)
                .Include(interaction => interaction.User)
                .Where(interaction =>
                    interaction.CompanyId == companyId &&
                    interaction.CustomerId == customerId &&
                    interaction.IsActive);

            var totalItems = await query.CountAsync();

            var items = await query
                .OrderByDescending(interaction => interaction.InteractionDate)
                .Skip(request.Skip)
                .Take(request.ValidPageSize)
                .Select(interaction => MapToResponse(interaction))
                .ToListAsync();

            return PagedResponse<InteractionResponse>.Create(items, totalItems, request);
        }

        public async Task<PagedResponse<InteractionResponse>> GetByLeadAsync(int leadId, PagedRequest request)
        {
            var companyId = GetCurrentCompanyId();

            var leadExists = await _context.Leads
                .AnyAsync(lead =>
                    lead.Id == leadId &&
                    lead.CompanyId == companyId &&
                    lead.IsActive);

            if (!leadExists)
            {
                throw new InvalidOperationException("El lead no existe o no pertenece a la empresa autenticada.");
            }

            var query = _context.Interactions
                .Include(interaction => interaction.Customer)
                .Include(interaction => interaction.Lead)
                .Include(interaction => interaction.User)
                .Where(interaction =>
                    interaction.CompanyId == companyId &&
                    interaction.LeadId == leadId &&
                    interaction.IsActive);

            var totalItems = await query.CountAsync();

            var items = await query
                .OrderByDescending(interaction => interaction.InteractionDate)
                .Skip(request.Skip)
                .Take(request.ValidPageSize)
                .Select(interaction => MapToResponse(interaction))
                .ToListAsync();

            return PagedResponse<InteractionResponse>.Create(items, totalItems, request);
        }

        public async Task<InteractionResponse?> GetByIdAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var interaction = await _context.Interactions
                .Include(interaction => interaction.Customer)
                .Include(interaction => interaction.Lead)
                .Include(interaction => interaction.User)
                .FirstOrDefaultAsync(interaction =>
                    interaction.Id == id &&
                    interaction.CompanyId == companyId &&
                    interaction.IsActive);

            return interaction is null ? null : MapToResponse(interaction);
        }

        public async Task<InteractionResponse> CreateAsync(CreateInteractionRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var userId = GetCurrentUserId();
            var interactionDate = request.InteractionDate ?? DateTime.UtcNow;

            ValidateCustomerOrLead(request.CustomerId, request.LeadId);
            ValidateInteractionInput(request.Type, request.Description, interactionDate);

            if (request.CustomerId.HasValue)
            {
                await EnsureCustomerBelongsToCompanyAsync(request.CustomerId.Value, companyId);
            }

            if (request.LeadId.HasValue)
            {
                await EnsureLeadBelongsToCompanyAsync(request.LeadId.Value, companyId);
            }

            var interaction = new Interaction
            {
                CompanyId = companyId,
                CustomerId = request.CustomerId,
                LeadId = request.LeadId,
                UserId = userId,
                Type = InputValidator.NormalizeRequiredText(request.Type, "El tipo de interaccion", minLength: 2, maxLength: 50),
                Description = InputValidator.NormalizeRequiredText(request.Description, "La descripcion de la interaccion", minLength: 5, maxLength: 1000),
                InteractionDate = interactionDate,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Interactions.Add(interaction);
            await _context.SaveChangesAsync();

            await LoadInteractionRelationsAsync(interaction);

            return MapToResponse(interaction);
        }

        public async Task<InteractionResponse?> UpdateAsync(int id, UpdateInteractionRequest request)
        {
            var companyId = GetCurrentCompanyId();

            var interaction = await _context.Interactions
                .FirstOrDefaultAsync(interaction =>
                    interaction.Id == id &&
                    interaction.CompanyId == companyId &&
                    interaction.IsActive);

            if (interaction is null)
            {
                return null;
            }

            var interactionDate = request.InteractionDate ?? interaction.InteractionDate;
            ValidateInteractionInput(request.Type, request.Description, interactionDate);

            interaction.Type = InputValidator.NormalizeRequiredText(request.Type, "El tipo de interaccion", minLength: 2, maxLength: 50);
            interaction.Description = InputValidator.NormalizeRequiredText(request.Description, "La descripcion de la interaccion", minLength: 5, maxLength: 1000);
            interaction.InteractionDate = interactionDate;
            interaction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await LoadInteractionRelationsAsync(interaction);

            return MapToResponse(interaction);
        }

        public async Task<bool> DeactivateAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var interaction = await _context.Interactions
                .FirstOrDefaultAsync(interaction =>
                    interaction.Id == id &&
                    interaction.CompanyId == companyId &&
                    interaction.IsActive);

            if (interaction is null)
            {
                return false;
            }

            interaction.IsActive = false;
            interaction.UpdatedAt = DateTime.UtcNow;

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

        private static void ValidateCustomerOrLead(int? customerId, int? leadId)
        {
            if (!customerId.HasValue && !leadId.HasValue)
            {
                throw new InvalidOperationException("La interaccion debe estar asociada a un cliente o a un lead.");
            }
        }

        private static void ValidateInteractionInput(string type, string description, DateTime interactionDate)
        {
            InputValidator.NormalizeRequiredText(type, "El tipo de interaccion", minLength: 2, maxLength: 50);
            InputValidator.NormalizeRequiredText(description, "La descripcion de la interaccion", minLength: 5, maxLength: 1000);
            InputValidator.ValidateNotTooOld(interactionDate, "La fecha de interaccion");
            InputValidator.ValidateNotInFuture(interactionDate, "La fecha de interaccion");
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

        private async Task EnsureLeadBelongsToCompanyAsync(int leadId, int companyId)
        {
            var leadExists = await _context.Leads
                .AnyAsync(lead =>
                    lead.Id == leadId &&
                    lead.CompanyId == companyId &&
                    lead.IsActive);

            if (!leadExists)
            {
                throw new InvalidOperationException("El lead no existe o no pertenece a la empresa autenticada.");
            }
        }

        private async Task LoadInteractionRelationsAsync(Interaction interaction)
        {
            await _context.Entry(interaction)
                .Reference(item => item.Customer)
                .LoadAsync();

            await _context.Entry(interaction)
                .Reference(item => item.Lead)
                .LoadAsync();

            await _context.Entry(interaction)
                .Reference(item => item.User)
                .LoadAsync();
        }

        private static InteractionResponse MapToResponse(Interaction interaction)
        {
            return new InteractionResponse
            {
                Id = interaction.Id,
                CompanyId = interaction.CompanyId,
                CustomerId = interaction.CustomerId,
                CustomerName = interaction.Customer?.Name,
                LeadId = interaction.LeadId,
                LeadTitle = interaction.Lead?.Title,
                UserId = interaction.UserId,
                UserFullName = interaction.User.FullName,
                Type = interaction.Type,
                Description = interaction.Description,
                InteractionDate = interaction.InteractionDate,
                IsActive = interaction.IsActive,
                CreatedAt = interaction.CreatedAt,
                UpdatedAt = interaction.UpdatedAt
            };
        }
    }
}
