//Gestiona tareas comerciales con seguridad multiempresa, usuario asignado, vencimientos y soft delete.
using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Tasks;
using LeadFlow.Application.Common.Validation;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.Tasks;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.Tasks
{
    // Servicio de tareas con seguridad multiempresa, soft delete y deteccion de vencimientos.
    public class TaskService : ITaskService
    {
        private static readonly string[] AllowedStatuses =
        [
            "Pendiente",
            "En proceso",
            "Completada",
            "Cancelada"
        ];

        private static readonly string[] AllowedPriorities =
        [
            "Baja",
            "Media",
            "Alta"
        ];

        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public TaskService(LeadFlowDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<PagedResponse<TaskResponse>> GetAllAsync(PagedRequest request)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Tasks
                .Include(task => task.Customer)
                .Include(task => task.Lead)
                .Include(task => task.AssignedUser)
                .Where(task => task.CompanyId == companyId && task.IsActive);

            query = ApplyTaskScope(query);

            var totalItems = await query.CountAsync();

            // Devuelve tareas por pagina para que las agendas grandes no carguen todos los registros de una vez.
            var items = await query
                .OrderBy(task => task.DueDate)
                .Skip(request.Skip)
                .Take(request.ValidPageSize)
                .Select(task => MapToResponse(task))
                .ToListAsync();

            return PagedResponse<TaskResponse>.Create(items, totalItems, request);
        }

        public async Task<List<TaskResponse>> GetOverdueAsync()
        {
            var companyId = GetCurrentCompanyId();
            var now = DateTime.UtcNow;

            var query = _context.Tasks
                .Include(task => task.Customer)
                .Include(task => task.Lead)
                .Include(task => task.AssignedUser)
                .Where(task =>
                    task.CompanyId == companyId &&
                    task.IsActive &&
                    task.DueDate.HasValue &&
                    task.DueDate.Value < now &&
                    task.Status != "Completada");

            query = ApplyTaskScope(query);

            return await query
                .OrderBy(task => task.DueDate)
                .Select(task => MapToResponse(task))
                .ToListAsync();
        }

        public async Task<TaskResponse?> GetByIdAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Tasks
                .Include(task => task.Customer)
                .Include(task => task.Lead)
                .Include(task => task.AssignedUser)
                .Where(task =>
                    task.Id == id &&
                    task.CompanyId == companyId &&
                    task.IsActive);

            query = ApplyTaskScope(query);

            var task = await query.FirstOrDefaultAsync();

            return task is null ? null : MapToResponse(task);
        }

        public async Task<TaskResponse> CreateAsync(CreateTaskRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var assignedUserId = ResolveAssignedUserIdForWrite(request.AssignedUserId);
            var title = InputValidator.NormalizeRequiredText(request.Title, "El titulo de la tarea", minLength: 3, maxLength: 200);
            var status = InputValidator.NormalizeRequiredText(request.Status, "El estado de la tarea", maxLength: 50);
            var priority = InputValidator.NormalizeRequiredText(request.Priority, "La prioridad de la tarea", maxLength: 50);

            ValidateTaskInput(title, status, priority, request.DueDate, completedAt: null);
            ValidateCustomerOrLead(request.CustomerId, request.LeadId);

            await EnsureAssignedUserBelongsToCompanyAsync(assignedUserId, companyId);

            if (request.CustomerId.HasValue)
            {
                await EnsureCustomerBelongsToCompanyAsync(request.CustomerId.Value, companyId);
            }

            if (request.LeadId.HasValue)
            {
                await EnsureLeadBelongsToCompanyAsync(request.LeadId.Value, companyId);
                await EnsureLeadIsAllowedForCurrentUserAsync(request.LeadId.Value, companyId);
            }

            var task = new TaskItem
            {
                CompanyId = companyId,
                CustomerId = request.CustomerId,
                LeadId = request.LeadId,
                AssignedUserId = assignedUserId,
                Title = title,
                Description = InputValidator.NormalizeOptionalText(request.Description, "La descripcion de la tarea", maxLength: 1000),
                Status = status,
                Priority = priority,
                DueDate = request.DueDate,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            if (task.Status == "Completada")
            {
                task.CompletedAt = DateTime.UtcNow;
            }

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            await LoadTaskRelationsAsync(task);

            return MapToResponse(task);
        }

        public async Task<TaskResponse?> UpdateAsync(int id, UpdateTaskRequest request)
        {
            var companyId = GetCurrentCompanyId();

            var assignedUserId = ResolveAssignedUserIdForWrite(request.AssignedUserId);
            var title = InputValidator.NormalizeRequiredText(request.Title, "El titulo de la tarea", minLength: 3, maxLength: 200);
            var status = InputValidator.NormalizeRequiredText(request.Status, "El estado de la tarea", maxLength: 50);
            var priority = InputValidator.NormalizeRequiredText(request.Priority, "La prioridad de la tarea", maxLength: 50);

            var query = _context.Tasks
                .Where(task =>
                    task.Id == id &&
                    task.CompanyId == companyId &&
                    task.IsActive);

            query = ApplyTaskScope(query);

            var task = await query.FirstOrDefaultAsync();

            if (task is null)
            {
                return null;
            }

            ValidateTaskInput(title, status, priority, request.DueDate, request.CompletedAt);
            ValidateCustomerOrLead(request.CustomerId, request.LeadId);

            await EnsureAssignedUserBelongsToCompanyAsync(assignedUserId, companyId);

            if (request.CustomerId.HasValue)
            {
                await EnsureCustomerBelongsToCompanyAsync(request.CustomerId.Value, companyId);
            }

            if (request.LeadId.HasValue)
            {
                await EnsureLeadBelongsToCompanyAsync(request.LeadId.Value, companyId);
                await EnsureLeadIsAllowedForCurrentUserAsync(request.LeadId.Value, companyId);
            }

            task.CustomerId = request.CustomerId;
            task.LeadId = request.LeadId;
            task.AssignedUserId = assignedUserId;
            task.Title = title;
            task.Description = InputValidator.NormalizeOptionalText(request.Description, "La descripcion de la tarea", maxLength: 1000);
            task.Status = status;
            task.Priority = priority;
            task.DueDate = request.DueDate;
            task.CompletedAt = request.CompletedAt;
            task.UpdatedAt = DateTime.UtcNow;

            if (task.Status == "Completada" && !task.CompletedAt.HasValue)
            {
                task.CompletedAt = DateTime.UtcNow;
            }

            if (task.Status != "Completada")
            {
                task.CompletedAt = null;
            }

            await _context.SaveChangesAsync();

            await LoadTaskRelationsAsync(task);

            return MapToResponse(task);
        }

        public async Task<TaskResponse?> UpdateStatusAsync(int id, UpdateTaskStatusRequest request)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Tasks
                .Where(task =>
                    task.Id == id &&
                    task.CompanyId == companyId &&
                    task.IsActive);

            query = ApplyTaskScope(query);

            var task = await query.FirstOrDefaultAsync();

            if (task is null)
            {
                return null;
            }

            ValidateTaskStatus(request.Status);

            task.Status = request.Status.Trim();
            task.UpdatedAt = DateTime.UtcNow;

            if (task.Status == "Completada")
            {
                task.CompletedAt = DateTime.UtcNow;
            }
            else
            {
                task.CompletedAt = null;
            }

            await _context.SaveChangesAsync();

            await LoadTaskRelationsAsync(task);

            return MapToResponse(task);
        }

        public async Task<bool> DeactivateAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Tasks
                .Where(task =>
                    task.Id == id &&
                    task.CompanyId == companyId &&
                    task.IsActive);

            query = ApplyTaskScope(query);

            var task = await query.FirstOrDefaultAsync();

            if (task is null)
            {
                return false;
            }

            task.IsActive = false;
            task.UpdatedAt = DateTime.UtcNow;

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

        private IQueryable<TaskItem> ApplyTaskScope(IQueryable<TaskItem> query)
        {
            if (CanManageCompanyScope())
            {
                return query;
            }

            var userId = GetCurrentUserId();
            return query.Where(task => task.AssignedUserId == userId);
        }

        private int ResolveAssignedUserIdForWrite(int requestedAssignedUserId)
        {
            if (CanManageCompanyScope())
            {
                return requestedAssignedUserId;
            }

            var currentUserId = GetCurrentUserId();

            if (requestedAssignedUserId != currentUserId)
            {
                throw new InvalidOperationException("Solo puedes asignar tareas a tu propio usuario.");
            }

            return currentUserId;
        }

        private static void ValidateCustomerOrLead(int? customerId, int? leadId)
        {
            if (!customerId.HasValue && !leadId.HasValue)
            {
                throw new InvalidOperationException("La tarea debe estar asociada a un cliente o a un lead.");
            }
        }

        private static void ValidateTaskInput(
            string title,
            string status,
            string priority,
            DateTime? dueDate,
            DateTime? completedAt)
        {
            InputValidator.NormalizeRequiredText(title, "El titulo de la tarea", minLength: 3, maxLength: 200);

            ValidateTaskStatus(status);

            if (!AllowedPriorities.Contains(priority.Trim()))
            {
                throw new InvalidOperationException("La prioridad de la tarea debe ser Baja, Media o Alta.");
            }

            InputValidator.ValidateNotTooOld(dueDate, "La fecha de vencimiento de la tarea");
            InputValidator.ValidateNotInFuture(completedAt, "La fecha de completado");
        }

        private static void ValidateTaskStatus(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                throw new InvalidOperationException("El estado de la tarea es requerido.");
            }

            if (!AllowedStatuses.Contains(status.Trim()))
            {
                throw new InvalidOperationException("El estado de la tarea debe ser Pendiente, En proceso, Completada o Cancelada.");
            }
        }

        private async Task EnsureAssignedUserBelongsToCompanyAsync(int userId, int companyId)
        {
            var userExists = await _context.Users
                .AnyAsync(user =>
                    user.Id == userId &&
                    user.CompanyId == companyId &&
                    user.IsActive);

            if (!userExists)
            {
                throw new InvalidOperationException("El usuario asignado no existe o no pertenece a la empresa autenticada.");
            }
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

        private async Task EnsureLeadIsAllowedForCurrentUserAsync(int leadId, int companyId)
        {
            if (CanManageCompanyScope())
            {
                return;
            }

            var userId = GetCurrentUserId();

            var leadIsAssignedToUser = await _context.Leads
                .AnyAsync(lead =>
                    lead.Id == leadId &&
                    lead.CompanyId == companyId &&
                    lead.AssignedUserId == userId &&
                    lead.IsActive);

            if (!leadIsAssignedToUser)
            {
                throw new InvalidOperationException("Solo puedes crear o editar tareas sobre leads asignados a tu usuario.");
            }
        }

        private async Task LoadTaskRelationsAsync(TaskItem task)
        {
            await _context.Entry(task)
                .Reference(item => item.Customer)
                .LoadAsync();

            await _context.Entry(task)
                .Reference(item => item.Lead)
                .LoadAsync();

            await _context.Entry(task)
                .Reference(item => item.AssignedUser)
                .LoadAsync();
        }

        private static TaskResponse MapToResponse(TaskItem task)
        {
            return new TaskResponse
            {
                Id = task.Id,
                CompanyId = task.CompanyId,
                CustomerId = task.CustomerId,
                CustomerName = task.Customer?.Name,
                LeadId = task.LeadId,
                LeadTitle = task.Lead?.Title,
                AssignedUserId = task.AssignedUserId,
                AssignedUserName = task.AssignedUser.FullName,
                Title = task.Title,
                Description = task.Description,
                Status = task.Status,
                Priority = task.Priority,
                DueDate = task.DueDate,
                CompletedAt = task.CompletedAt,
                IsOverdue = task.DueDate.HasValue &&
                            task.DueDate.Value < DateTime.UtcNow &&
                            task.Status != "Completada",
                IsActive = task.IsActive,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt
            };
        }
    }
}
