using LeadFlow.Application.DTOs.Services;
using LeadFlow.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/services")]
    [Authorize]
    public class ServicesController : ControllerBase
    {
        private readonly IServiceItemService _serviceItemService;

        public ServicesController(IServiceItemService serviceItemService)
        {
            _serviceItemService = serviceItemService;
        }

        // Obtiene los servicios activos de la empresa autenticada.
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] LeadFlow.Application.DTOs.Common.PagedRequest request)
        {
            var services = await _serviceItemService.GetAllAsync(request);
            return Ok(services);
        }

        // Obtiene un servicio especifico si pertenece a la empresa autenticada.
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var service = await _serviceItemService.GetByIdAsync(id);

            if (service is null)
            {
                return NotFound(new
                {
                    message = "Servicio no encontrado."
                });
            }

            return Ok(service);
        }

        // Crea un nuevo servicio para el catalogo de la empresa autenticada.
        [HttpPost]
        public async Task<IActionResult> Create(CreateServiceRequest request)
        {
            try
            {
                var service = await _serviceItemService.CreateAsync(request);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = service.Id },
                    service
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // Actualiza un servicio existente del catalogo de la empresa autenticada.
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, UpdateServiceRequest request)
        {
            try
            {
                var service = await _serviceItemService.UpdateAsync(id, request);

                if (service is null)
                {
                    return NotFound(new
                    {
                        message = "Servicio no encontrado."
                    });
                }

                return Ok(service);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // Desactiva un servicio sin eliminarlo fisicamente para conservar historial de cotizaciones futuras.
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var wasDeactivated = await _serviceItemService.DeactivateAsync(id);

            if (!wasDeactivated)
            {
                return NotFound(new
                {
                    message = "Servicio no encontrado."
                });
            }

            return NoContent();
        }
    }
}
