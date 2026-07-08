//Define las operaciones que el módulo de clientes debe soportar.
using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Customers;

namespace LeadFlow.Application.Interfaces.Customers
{
    public interface ICustomerService
    {
        Task<PagedResponse<CustomerResponse>> GetAllAsync(PagedRequest request);

        Task<CustomerResponse?> GetByIdAsync(int id);

        Task<CustomerResponse> CreateAsync(CreateCustomerRequest request);

        Task<CustomerResponse?> UpdateAsync(int id, UpdateCustomerRequest request);

        Task<bool> DeactivateAsync(int id);
    }
}
