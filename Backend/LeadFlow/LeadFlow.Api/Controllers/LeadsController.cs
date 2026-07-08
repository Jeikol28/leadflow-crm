using LeadFlow.Application.DTOs.Leads;
using LeadFlow.Application.Interfaces.Leads;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

//Este controller expone los endpoints de oportunidades comerciales.
namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/leads")]
    [Authorize]
    public class LeadsController : ControllerBase
    {
        private readonly ILeadService _leadService;

        public LeadsController(ILeadService leadService)
        {
            _leadService = leadService;
        }

        // Obtiene todos los leads de la empresa autenticada.
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] LeadFlow.Application.DTOs.Common.PagedRequest request)
        {
            var leads = await _leadService.GetAllAsync(request);
            return Ok(leads);
        }

        // Obtiene un lead especifico si pertenece a la empresa autenticada.
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var lead = await _leadService.GetByIdAsync(id);

            if (lead is null)
            {
                return NotFound(new
                {
                    message = "Lead no encontrado."
                });
            }

            return Ok(lead);
        }

        // Crea una nueva oportunidad comercial para un cliente de la empresa autenticada.
        [HttpPost]
        public async Task<IActionResult> Create(CreateLeadRequest request)
        {
            try
            {
                var lead = await _leadService.CreateAsync(request);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = lead.Id },
                    lead
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

        // Actualiza los datos principales de un lead.
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, UpdateLeadRequest request)
        {
            try
            {
                var lead = await _leadService.UpdateAsync(id, request);

                if (lead is null)
                {
                    return NotFound(new
                    {
                        message = "Lead no encontrado."
                    });
                }

                return Ok(lead);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // Cambia solo el estado del lead, pensado para el pipeline Kanban.
        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, UpdateLeadStatusRequest request)
        {
            var lead = await _leadService.UpdateStatusAsync(id, request);

            if (lead is null)
            {
                return NotFound(new
                {
                    message = "Lead no encontrado."
                });
            }

            return Ok(lead);
        }

        // Elimina un lead de la empresa autenticada.
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var wasDeleted = await _leadService.DeleteAsync(id);

            if (!wasDeleted)
            {
                return NotFound(new
                {
                    message = "Lead no encontrado."
                });
            }

            return NoContent();
        }
    }
}
