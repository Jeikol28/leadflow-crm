using LeadFlow.Application.Common.Security;
using LeadFlow.Application.Common.Validation;
using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Users;
using LeadFlow.Application.Interfaces.AuditLogs;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.Users;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.Users
{
    // Servicio para administrar usuarios de una empresa con roles permitidos y seguridad multiempresa.
    public class UserService : IUserService
    {
        private const string AdminRole = "AdminEmpresa";

        private static readonly string[] CompanyRoles =
        [
            AdminRole,
            "Gerente",
            "Vendedor",
            "Soporte"
        ];

        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditLogService _auditLogService;
        private readonly PasswordHasher<User> _passwordHasher;

        public UserService(
            LeadFlowDbContext context,
            ICurrentUserService currentUserService,
            IAuditLogService auditLogService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _auditLogService = auditLogService;
            _passwordHasher = new PasswordHasher<User>();
        }

        public async Task<PagedResponse<UserResponse>> GetAllAsync(PagedRequest request)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Users
                .Where(user => user.CompanyId == companyId);

            var totalItems = await query.CountAsync();

            // Devuelve usuarios por pagina para soportar empresas con equipos grandes.
            var items = await query
                .OrderBy(user => user.FullName)
                .Skip(request.Skip)
                .Take(request.ValidPageSize)
                .Select(user => MapToResponse(user))
                .ToListAsync();

            return PagedResponse<UserResponse>.Create(items, totalItems, request);
        }

        public async Task<UserResponse?> GetByIdAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var user = await _context.Users
                .FirstOrDefaultAsync(user =>
                    user.Id == id &&
                    user.CompanyId == companyId);

            return user is null ? null : MapToResponse(user);
        }

        public async Task<UserResponse> CreateAsync(CreateUserRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var email = InputValidator.NormalizeRequiredEmail(request.Email, "El correo del usuario");
            var fullName = InputValidator.NormalizeRequiredText(request.FullName, "El nombre del usuario", minLength: 3, maxLength: 150);
            var role = InputValidator.NormalizeRequiredText(request.Role, "El rol del usuario", maxLength: 50);

            ValidateRole(role);
            ValidatePassword(request.Password);

            var emailExists = await _context.Users
                .AnyAsync(user => user.Email == email);

            if (emailExists)
            {
                throw new InvalidOperationException("Ya existe un usuario registrado con ese correo.");
            }

            var user = new User
            {
                CompanyId = companyId,
                FullName = fullName,
                Email = email,
                Role = role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password.Trim());

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                "Create",
                "User",
                user.Id,
                $"Se creo el usuario {user.Email} con rol {user.Role}.");

            return MapToResponse(user);
        }

        public async Task<UserResponse?> UpdateAsync(int id, UpdateUserRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var currentUserId = GetCurrentUserId();
            var email = InputValidator.NormalizeRequiredEmail(request.Email, "El correo del usuario");
            var fullName = InputValidator.NormalizeRequiredText(request.FullName, "El nombre del usuario", minLength: 3, maxLength: 150);
            var role = InputValidator.NormalizeRequiredText(request.Role, "El rol del usuario", maxLength: 50);

            ValidateRole(role);

            var user = await _context.Users
                .FirstOrDefaultAsync(user =>
                    user.Id == id &&
                    user.CompanyId == companyId);

            if (user is null)
            {
                return null;
            }

            var emailExists = await _context.Users
                .AnyAsync(item =>
                    item.Email == email &&
                    item.Id != id);

            if (emailExists)
            {
                throw new InvalidOperationException("Ya existe otro usuario registrado con ese correo.");
            }

            if (id == currentUserId && !request.IsActive)
            {
                throw new InvalidOperationException("No puedes desactivar tu propio usuario.");
            }

            if (id == currentUserId && user.Role == AdminRole && role != AdminRole)
            {
                throw new InvalidOperationException("No puedes quitarte tu propio rol de administrador.");
            }

            if (user.IsActive && user.Role == AdminRole && role != AdminRole)
            {
                await EnsureAnotherActiveAdminExistsAsync(
                    companyId,
                    user.Id,
                    "No puedes cambiar el rol del ultimo administrador activo de la empresa.");
            }

            if (user.IsActive && user.Role == AdminRole && !request.IsActive)
            {
                await EnsureAnotherActiveAdminExistsAsync(
                    companyId,
                    user.Id,
                    "No puedes desactivar el ultimo administrador activo de la empresa.");
            }

            user.FullName = fullName;
            user.Email = email;
            user.Role = role;
            user.IsActive = request.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                "Update",
                "User",
                user.Id,
                $"Se actualizo el usuario {user.Email} con rol {user.Role}.");

            return MapToResponse(user);
        }

        public async Task<UserResponse?> UpdateStatusAsync(int id, UpdateUserStatusRequest request)
        {
            var companyId = GetCurrentCompanyId();
            var currentUserId = GetCurrentUserId();

            var user = await _context.Users
                .FirstOrDefaultAsync(user =>
                    user.Id == id &&
                    user.CompanyId == companyId);

            if (user is null)
            {
                return null;
            }

            if (id == currentUserId && !request.IsActive)
            {
                throw new InvalidOperationException("No puedes desactivar tu propio usuario.");
            }

            if (user.IsActive && user.Role == AdminRole && !request.IsActive)
            {
                await EnsureAnotherActiveAdminExistsAsync(
                    companyId,
                    user.Id,
                    "No puedes desactivar el ultimo administrador activo de la empresa.");
            }

            user.IsActive = request.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                request.IsActive ? "Activate" : "Deactivate",
                "User",
                user.Id,
                request.IsActive
                    ? $"Se activo el usuario {user.Email}."
                    : $"Se desactivo el usuario {user.Email}.");

            return MapToResponse(user);
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

        private static void ValidateRole(string role)
        {
            if (!CompanyRoles.Contains(role.Trim()))
            {
                throw new InvalidOperationException("El rol indicado no es valido para usuarios de empresa.");
            }
        }

        private static void ValidatePassword(string password)
        {
            PasswordPolicy.ValidateOrThrow(password);
        }

        private async Task EnsureAnotherActiveAdminExistsAsync(int companyId, int userId, string errorMessage)
        {
            // Protege la empresa para que siempre conserve al menos un administrador activo.
            var hasAnotherActiveAdmin = await _context.Users
                .AnyAsync(user =>
                    user.CompanyId == companyId &&
                    user.Id != userId &&
                    user.Role == AdminRole &&
                    user.IsActive);

            if (!hasAnotherActiveAdmin)
            {
                throw new InvalidOperationException(errorMessage);
            }
        }

        private static UserResponse MapToResponse(User user)
        {
            return new UserResponse
            {
                Id = user.Id,
                CompanyId = user.CompanyId,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };
        }
    }
}
