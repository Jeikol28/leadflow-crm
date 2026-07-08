//Define las operaciones del módulo Tasks.

using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Tasks;

namespace LeadFlow.Application.Interfaces.Tasks
{
    public interface ITaskService
    {
        Task<PagedResponse<TaskResponse>> GetAllAsync(PagedRequest request);

        Task<List<TaskResponse>> GetOverdueAsync();

        Task<TaskResponse?> GetByIdAsync(int id);

        Task<TaskResponse> CreateAsync(CreateTaskRequest request);

        Task<TaskResponse?> UpdateAsync(int id, UpdateTaskRequest request);

        Task<TaskResponse?> UpdateStatusAsync(int id, UpdateTaskStatusRequest request);

        Task<bool> DeactivateAsync(int id);
    }
}
