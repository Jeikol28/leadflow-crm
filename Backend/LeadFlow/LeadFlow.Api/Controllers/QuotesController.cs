using LeadFlow.Application.DTOs.Quotes;
using LeadFlow.Application.Interfaces.Quotes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/quotes")]
    [Authorize]
    public class QuotesController : ControllerBase
    {
        private readonly IQuoteService _quoteService;
        private readonly IQuotePdfService _quotePdfService;
        private readonly IQuoteEmailService _quoteEmailService;

        public QuotesController(
            IQuoteService quoteService,
            IQuotePdfService quotePdfService,
            IQuoteEmailService quoteEmailService)
        {
            _quoteService = quoteService;
            _quotePdfService = quotePdfService;
            _quoteEmailService = quoteEmailService;
        }

        // Obtiene las cotizaciones activas de la empresa autenticada.
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] LeadFlow.Application.DTOs.Common.PagedRequest request)
        {
            var quotes = await _quoteService.GetAllAsync(request);
            return Ok(quotes);
        }

        // Obtiene una cotizacion especifica con sus items.
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var quote = await _quoteService.GetByIdAsync(id);

            if (quote is null)
            {
                return NotFound(new
                {
                    message = "Cotizacion no encontrada."
                });
            }

            return Ok(quote);
        }

        // Genera un PDF descargable de la cotizacion con formato comercial profesional.
        [HttpGet("{id:int}/pdf")]
        public async Task<IActionResult> DownloadPdf(int id)
        {
            var pdfBytes = await _quotePdfService.GenerateQuotePdfAsync(id);

            if (pdfBytes is null)
            {
                return NotFound(new
                {
                    message = "Cotizacion no encontrada."
                });
            }

            return File(pdfBytes, "application/pdf", $"cotizacion-{id}.pdf");
        }

        // Simula el envio por correo de una cotizacion y la marca como enviada.
        [HttpPost("{id:int}/send-email")]
        public async Task<IActionResult> SendEmail(int id)
        {
            try
            {
                var response = await _quoteEmailService.SendQuoteEmailAsync(id);

                if (response is null)
                {
                    return NotFound(new
                    {
                        message = "Cotizacion no encontrada."
                    });
                }

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

        // Crea una cotizacion y calcula subtotal, IVA y total en backend.
        [HttpPost]
        public async Task<IActionResult> Create(CreateQuoteRequest request)
        {
            try
            {
                var quote = await _quoteService.CreateAsync(request);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = quote.Id },
                    quote
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

        // Actualiza una cotizacion y recalcula sus totales.
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, UpdateQuoteRequest request)
        {
            try
            {
                var quote = await _quoteService.UpdateAsync(id, request);

                if (quote is null)
                {
                    return NotFound(new
                    {
                        message = "Cotizacion no encontrada."
                    });
                }

                return Ok(quote);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // Cambia el estado de una cotizacion; si se acepta puede marcar el lead como ganado.
        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, UpdateQuoteStatusRequest request)
        {
            var quote = await _quoteService.UpdateStatusAsync(id, request);

            if (quote is null)
            {
                return NotFound(new
                {
                    message = "Cotizacion no encontrada."
                });
            }

            return Ok(quote);
        }

        // Desactiva una cotizacion sin eliminarla fisicamente.
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var wasDeactivated = await _quoteService.DeactivateAsync(id);

            if (!wasDeactivated)
            {
                return NotFound(new
                {
                    message = "Cotizacion no encontrada."
                });
            }

            return NoContent();
        }
    }
}
