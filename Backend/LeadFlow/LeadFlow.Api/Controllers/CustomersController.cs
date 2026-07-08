using LeadFlow.Application.DTOs.Customers;
using LeadFlow.Application.Interfaces.Customers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


//Este controller expondrá los endpoints HTTP del módulo Customers.
namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/customers")]
    [Authorize]
    public class CustomersController : ControllerBase
    {
        private readonly ICustomerService _customerService;

        public CustomersController(ICustomerService customerService)
        {
            _customerService = customerService;
        }

        // Obtiene todos los clientes activos de la empresa autenticada.
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] LeadFlow.Application.DTOs.Common.PagedRequest request)
        {
            var customers = await _customerService.GetAllAsync(request);
            return Ok(customers);
        }

        // Obtiene un cliente por id siempre que pertenezca a la empresa autenticada.
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var customer = await _customerService.GetByIdAsync(id);

            if (customer is null)
            {
                return NotFound(new
                {
                    message = "Cliente no encontrado."
                });
            }

            return Ok(customer);
        }

        // Crea un cliente asociado automaticamente a la empresa del usuario autenticado.
        [HttpPost]
        public async Task<IActionResult> Create(CreateCustomerRequest request)
        {
            var customer = await _customerService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = customer.Id },
                customer
            );
        }

        // Actualiza un cliente si existe y pertenece a la empresa autenticada.
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, UpdateCustomerRequest request)
        {
            var customer = await _customerService.UpdateAsync(id, request);

            if (customer is null)
            {
                return NotFound(new
                {
                    message = "Cliente no encontrado."
                });
            }

            return Ok(customer);
        }

        // Desactiva un cliente sin eliminarlo fisicamente de la base de datos.
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var wasDeactivated = await _customerService.DeactivateAsync(id);

            if (!wasDeactivated)
            {
                return NotFound(new
                {
                    message = "Cliente no encontrado."
                });
            }

            return NoContent();
        }
    }
}
