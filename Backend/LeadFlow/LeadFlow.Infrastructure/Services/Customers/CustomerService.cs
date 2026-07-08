//Este servicio contiene la lógica del módulo Customers y aplica la regla multiempresa:
//Solo consultar clientes donde CompanyId = CompanyId del token.

using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Customers;
using LeadFlow.Application.Common.Validation;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Application.Interfaces.Customers;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Infrastructure.Services.Customers
{
    // Servicio de clientes con filtro multiempresa basado en el CompanyId del usuario autenticado.
    public class CustomerService : ICustomerService
    {
        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public CustomerService(LeadFlowDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<PagedResponse<CustomerResponse>> GetAllAsync(PagedRequest request)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Customers
                //Esta línea es la protección multiempresa: Evita que una empresa vea clientes de otra
                .Where(customer => customer.CompanyId == companyId && customer.IsActive);

            query = ApplyCustomerScope(query);

            var totalItems = await query.CountAsync();

            // Devuelve solo la pagina solicitada para evitar respuestas pesadas cuando la empresa tenga muchos clientes.
            var items = await query
                .OrderByDescending(customer => customer.CreatedAt)
                .Skip(request.Skip)
                .Take(request.ValidPageSize)
                .Select(customer => MapToResponse(customer))
                .ToListAsync();

            return PagedResponse<CustomerResponse>.Create(items, totalItems, request);
        }

        public async Task<CustomerResponse?> GetByIdAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Customers
                .Where(customer =>
                    customer.Id == id &&
                    customer.CompanyId == companyId &&
                    customer.IsActive);

            query = ApplyCustomerScope(query);

            var customer = await query.FirstOrDefaultAsync();

            return customer is null ? null : MapToResponse(customer);
        }

        public async Task<CustomerResponse> CreateAsync(CreateCustomerRequest request)
        {
            var companyId = GetCurrentCompanyId();
            ValidateCustomerInput(request);

            var customer = new Customer
            {
                CompanyId = companyId,
                Name = InputValidator.NormalizeRequiredText(request.Name, "El nombre del cliente", minLength: 2, maxLength: 150),
                Email = InputValidator.NormalizeOptionalEmail(request.Email, "El correo del cliente"),
                Phone = InputValidator.NormalizeOptionalPhone(request.Phone, "El telefono del cliente"),
                Province = InputValidator.NormalizeOptionalText(request.Province, "La provincia del cliente", maxLength: 80),
                Canton = InputValidator.NormalizeOptionalText(request.Canton, "El canton del cliente", maxLength: 80),
                Address = InputValidator.NormalizeOptionalText(request.Address, "La direccion del cliente", maxLength: 300),
                Source = InputValidator.NormalizeOptionalText(request.Source, "La fuente del cliente", maxLength: 80),
                Status = InputValidator.NormalizeRequiredText(request.Status, "El estado del cliente", maxLength: 50),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return MapToResponse(customer);
        }

        public async Task<CustomerResponse?> UpdateAsync(int id, UpdateCustomerRequest request)
        {
            var companyId = GetCurrentCompanyId();
            ValidateCustomerInput(request);

            var query = _context.Customers
                .Where(customer =>
                    customer.Id == id &&
                    customer.CompanyId == companyId &&
                    customer.IsActive);

            query = ApplyCustomerScope(query);

            var customer = await query.FirstOrDefaultAsync();

            if (customer is null)
            {
                return null;
            }

            customer.Name = InputValidator.NormalizeRequiredText(request.Name, "El nombre del cliente", minLength: 2, maxLength: 150);
            customer.Email = InputValidator.NormalizeOptionalEmail(request.Email, "El correo del cliente");
            customer.Phone = InputValidator.NormalizeOptionalPhone(request.Phone, "El telefono del cliente");
            customer.Province = InputValidator.NormalizeOptionalText(request.Province, "La provincia del cliente", maxLength: 80);
            customer.Canton = InputValidator.NormalizeOptionalText(request.Canton, "El canton del cliente", maxLength: 80);
            customer.Address = InputValidator.NormalizeOptionalText(request.Address, "La direccion del cliente", maxLength: 300);
            customer.Source = InputValidator.NormalizeOptionalText(request.Source, "La fuente del cliente", maxLength: 80);
            customer.Status = InputValidator.NormalizeRequiredText(request.Status, "El estado del cliente", maxLength: 50);
            customer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToResponse(customer);
        }

        public async Task<bool> DeactivateAsync(int id)
        {
            var companyId = GetCurrentCompanyId();

            var query = _context.Customers
                .Where(customer =>
                    customer.Id == id &&
                    customer.CompanyId == companyId &&
                    customer.IsActive);

            query = ApplyCustomerScope(query);

            var customer = await query.FirstOrDefaultAsync();

            if (customer is null)
            {
                return false;
            }

            customer.IsActive = false;
            customer.UpdatedAt = DateTime.UtcNow;

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

        private IQueryable<Customer> ApplyCustomerScope(IQueryable<Customer> query)
        {
            if (CanManageCompanyScope())
            {
                return query;
            }

            var userId = GetCurrentUserId();

            return query.Where(customer =>
                customer.Leads.Any(lead => lead.IsActive && lead.AssignedUserId == userId) ||
                customer.Tasks.Any(task => task.IsActive && task.AssignedUserId == userId) ||
                customer.Interactions.Any(interaction => interaction.IsActive && interaction.UserId == userId) ||
                customer.Quotes.Any(quote => quote.IsActive && quote.CreatedByUserId == userId));
        }

        private static void ValidateCustomerInput(CreateCustomerRequest request)
        {
            InputValidator.NormalizeRequiredText(request.Name, "El nombre del cliente", minLength: 2, maxLength: 150);
            InputValidator.NormalizeOptionalEmail(request.Email, "El correo del cliente");
            InputValidator.NormalizeOptionalPhone(request.Phone, "El telefono del cliente");
            InputValidator.NormalizeOptionalText(request.Province, "La provincia del cliente", maxLength: 80);
            InputValidator.NormalizeOptionalText(request.Canton, "El canton del cliente", maxLength: 80);
            InputValidator.NormalizeOptionalText(request.Address, "La direccion del cliente", maxLength: 300);
            InputValidator.NormalizeOptionalText(request.Source, "La fuente del cliente", maxLength: 80);
            InputValidator.NormalizeRequiredText(request.Status, "El estado del cliente", maxLength: 50);
        }

        private static void ValidateCustomerInput(UpdateCustomerRequest request)
        {
            InputValidator.NormalizeRequiredText(request.Name, "El nombre del cliente", minLength: 2, maxLength: 150);
            InputValidator.NormalizeOptionalEmail(request.Email, "El correo del cliente");
            InputValidator.NormalizeOptionalPhone(request.Phone, "El telefono del cliente");
            InputValidator.NormalizeOptionalText(request.Province, "La provincia del cliente", maxLength: 80);
            InputValidator.NormalizeOptionalText(request.Canton, "El canton del cliente", maxLength: 80);
            InputValidator.NormalizeOptionalText(request.Address, "La direccion del cliente", maxLength: 300);
            InputValidator.NormalizeOptionalText(request.Source, "La fuente del cliente", maxLength: 80);
            InputValidator.NormalizeRequiredText(request.Status, "El estado del cliente", maxLength: 50);
        }

        private static CustomerResponse MapToResponse(Customer customer)
        {
            return new CustomerResponse
            {
                Id = customer.Id,
                CompanyId = customer.CompanyId,
                Name = customer.Name,
                Email = customer.Email,
                Phone = customer.Phone,
                Province = customer.Province,
                Canton = customer.Canton,
                Address = customer.Address,
                Source = customer.Source,
                Status = customer.Status,
                IsActive = customer.IsActive,
                CreatedAt = customer.CreatedAt,
                UpdatedAt = customer.UpdatedAt
            };
        }
    }
}
