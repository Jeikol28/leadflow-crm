using LeadFlow.Application.DTOs.AI;
using LeadFlow.Application.Interfaces.AI;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/ai")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly IAiContextService _aiContextService;
        private readonly IAiChatService _aiChatService;

        public AiController(IAiContextService aiContextService, IAiChatService aiChatService)
        {
            _aiContextService = aiContextService;
            _aiChatService = aiChatService;
        }

        // Devuelve un resumen seguro del CRM para futuras funciones de inteligencia artificial.
        [HttpGet("context")]
        public async Task<IActionResult> GetContext()
        {
            var context = await _aiContextService.GetContextAsync();
            return Ok(context);
        }

        // Responde preguntas comerciales usando el contexto seguro del CRM en modo simulado.
        [HttpPost("chat")]
        public async Task<IActionResult> Chat(AiChatRequest request)
        {
            try
            {
                var response = await _aiChatService.ChatAsync(request);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // Consulta el historial paginado de preguntas y respuestas realizadas al asistente de IA.
        [HttpGet("history")]
        public async Task<IActionResult> GetHistory(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] LeadFlow.Application.DTOs.Common.PagedRequest request)
        {
            var history = await _aiChatService.GetHistoryAsync(from, to, request);
            return Ok(history);
        }
    }
}
