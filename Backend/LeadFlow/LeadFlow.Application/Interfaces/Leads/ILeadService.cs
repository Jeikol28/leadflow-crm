//Define las operaciones principales del módulo Leads.

using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Leads;

namespace LeadFlow.Application.Interfaces.Leads
{
    public interface ILeadService
    {
        Task<PagedResponse<LeadResponse>> GetAllAsync(PagedRequest request);

        Task<LeadResponse?> GetByIdAsync(int id);

        Task<LeadResponse> CreateAsync(CreateLeadRequest request);

        Task<LeadResponse?> UpdateAsync(int id, UpdateLeadRequest request);

        Task<LeadResponse?> UpdateStatusAsync(int id, UpdateLeadStatusRequest request);

        Task<bool> DeleteAsync(int id);
    }
}
