//Define las operaciones del módulo de interacciones.

using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Interactions;

namespace LeadFlow.Application.Interfaces.Interactions
{
    public interface IInteractionService
    {
        Task<PagedResponse<InteractionResponse>> GetAllAsync(PagedRequest request);

        Task<PagedResponse<InteractionResponse>> GetByCustomerAsync(int customerId, PagedRequest request);

        Task<PagedResponse<InteractionResponse>> GetByLeadAsync(int leadId, PagedRequest request);

        Task<InteractionResponse?> GetByIdAsync(int id);

        Task<InteractionResponse> CreateAsync(CreateInteractionRequest request);

        Task<InteractionResponse?> UpdateAsync(int id, UpdateInteractionRequest request);

        Task<bool> DeactivateAsync(int id);
    }
}
