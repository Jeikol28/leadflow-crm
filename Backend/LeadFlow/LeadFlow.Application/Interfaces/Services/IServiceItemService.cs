using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Services;

namespace LeadFlow.Application.Interfaces.Services
{
    public interface IServiceItemService
    {
        Task<PagedResponse<ServiceResponse>> GetAllAsync(PagedRequest request);

        Task<ServiceResponse?> GetByIdAsync(int id);

        Task<ServiceResponse> CreateAsync(CreateServiceRequest request);

        Task<ServiceResponse?> UpdateAsync(int id, UpdateServiceRequest request);

        Task<bool> DeactivateAsync(int id);
    }
}
