using LeadFlow.Application.Interfaces.Alerts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/alerts")]
    [Authorize]
    public class AlertsController : ControllerBase
    {
        private readonly IAlertService _alertService;

        public AlertsController(IAlertService alertService)
        {
            _alertService = alertService;
        }

        // Devuelve alertas activas para seguimiento comercial y operativo.
        [HttpGet]
        public async Task<IActionResult> GetActiveAlerts()
        {
            var alerts = await _alertService.GetActiveAlertsAsync();
            return Ok(alerts);
        }
    }
}
