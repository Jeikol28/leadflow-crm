//Define las operaciones para administrar estados del pipeline por empresa.

using LeadFlow.Application.DTOs.LeadStatuses;

namespace LeadFlow.Application.Interfaces.LeadStatuses
{
    public interface ILeadStatusService
    {
        Task<List<LeadStatusResponse>> GetAllAsync();

        Task<LeadStatusResponse?> GetByIdAsync(int id);

        Task<LeadStatusResponse> CreateAsync(CreateLeadStatusRequest request);

        Task<LeadStatusResponse?> UpdateAsync(int id, UpdateLeadStatusDefinitionRequest request);

        Task<bool> DeactivateAsync(int id);
    }
}