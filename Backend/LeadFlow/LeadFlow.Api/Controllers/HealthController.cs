using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        // Endpoint simple para verificar que la API esta funcionando correctamente.
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new
            {
                status = "Healthy",
                service = "LeadFlow.Api",
                timestampUtc = DateTime.UtcNow
            });
        }
    }
}