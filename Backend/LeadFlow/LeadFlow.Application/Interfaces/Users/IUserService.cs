using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Users;

namespace LeadFlow.Application.Interfaces.Users
{
    public interface IUserService
    {
        Task<PagedResponse<UserResponse>> GetAllAsync(PagedRequest request);

        Task<UserResponse?> GetByIdAsync(int id);

        Task<UserResponse> CreateAsync(CreateUserRequest request);

        Task<UserResponse?> UpdateAsync(int id, UpdateUserRequest request);

        Task<UserResponse?> UpdateStatusAsync(int id, UpdateUserStatusRequest request);
    }
}
