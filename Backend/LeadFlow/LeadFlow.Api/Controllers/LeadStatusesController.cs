//Este controller permite que cada empresa administre sus estados del pipeline.

using LeadFlow.Application.DTOs.LeadStatuses;
using LeadFlow.Application.Interfaces.LeadStatuses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/lead-statuses")]
    [Authorize]
    public class LeadStatusesController : ControllerBase
    {
        private readonly ILeadStatusService _leadStatusService;

        public LeadStatusesController(ILeadStatusService leadStatusService)
        {
            _leadStatusService = leadStatusService;
        }

        // Obtiene los estados activos del pipeline de la empresa autenticada.
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var statuses = await _leadStatusService.GetAllAsync();
            return Ok(statuses);
        }

        // Obtiene un estado especifico del pipeline si pertenece a la empresa autenticada.
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var status = await _leadStatusService.GetByIdAsync(id);

            if (status is null)
            {
                return NotFound(new
                {
                    message = "Estado no encontrado."
                });
            }

            return Ok(status);
        }

        // Crea un nuevo estado para el pipeline de la empresa autenticada.
        [HttpPost]
        public async Task<IActionResult> Create(CreateLeadStatusRequest request)
        {
            try
            {
                var status = await _leadStatusService.CreateAsync(request);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = status.Id },
                    status
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

        // Actualiza la definicion de un estado del pipeline.
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, UpdateLeadStatusDefinitionRequest request)
        {
            try
            {
                var status = await _leadStatusService.UpdateAsync(id, request);

                if (status is null)
                {
                    return NotFound(new
                    {
                        message = "Estado no encontrado."
                    });
                }

                return Ok(status);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // Desactiva un estado sin eliminarlo fisicamente para conservar historial.
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var wasDeactivated = await _leadStatusService.DeactivateAsync(id);

            if (!wasDeactivated)
            {
                return NotFound(new
                {
                    message = "Estado no encontrado."
                });
            }

            return NoContent();
        }
    }
}