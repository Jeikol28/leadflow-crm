//Este controller expone endpoints para registrar y consultar historial comercial.

using LeadFlow.Application.DTOs.Interactions;
using LeadFlow.Application.Interfaces.Interactions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/interactions")]
    [Authorize]
    public class InteractionsController : ControllerBase
    {
        private readonly IInteractionService _interactionService;

        public InteractionsController(IInteractionService interactionService)
        {
            _interactionService = interactionService;
        }

        // Obtiene todas las interacciones activas de la empresa autenticada.
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] LeadFlow.Application.DTOs.Common.PagedRequest request)
        {
            var interactions = await _interactionService.GetAllAsync(request);
            return Ok(interactions);
        }

        // Obtiene una interaccion especifica si pertenece a la empresa autenticada.
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var interaction = await _interactionService.GetByIdAsync(id);

            if (interaction is null)
            {
                return NotFound(new
                {
                    message = "Interaccion no encontrada."
                });
            }

            return Ok(interaction);
        }

        // Obtiene la linea de tiempo de interacciones de un cliente.
        [HttpGet("customer/{customerId:int}")]
        public async Task<IActionResult> GetByCustomer(int customerId, [FromQuery] LeadFlow.Application.DTOs.Common.PagedRequest request)
        {
            try
            {
                var interactions = await _interactionService.GetByCustomerAsync(customerId, request);
                return Ok(interactions);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // Obtiene la linea de tiempo de interacciones de un lead.
        [HttpGet("lead/{leadId:int}")]
        public async Task<IActionResult> GetByLead(int leadId, [FromQuery] LeadFlow.Application.DTOs.Common.PagedRequest request)
        {
            try
            {
                var interactions = await _interactionService.GetByLeadAsync(leadId, request);
                return Ok(interactions);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // Registra una nueva interaccion comercial asociada a cliente o lead.
        [HttpPost]
        public async Task<IActionResult> Create(CreateInteractionRequest request)
        {
            try
            {
                var interaction = await _interactionService.CreateAsync(request);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = interaction.Id },
                    interaction
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

        // Actualiza los datos principales de una interaccion.
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, UpdateInteractionRequest request)
        {
            var interaction = await _interactionService.UpdateAsync(id, request);

            if (interaction is null)
            {
                return NotFound(new
                {
                    message = "Interaccion no encontrada."
                });
            }

            return Ok(interaction);
        }

        // Desactiva una interaccion sin eliminarla fisicamente.
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var wasDeactivated = await _interactionService.DeactivateAsync(id);

            if (!wasDeactivated)
            {
                return NotFound(new
                {
                    message = "Interaccion no encontrada."
                });
            }

            return NoContent();
        }
    }
}
