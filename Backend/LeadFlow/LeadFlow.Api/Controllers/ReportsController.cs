using LeadFlow.Application.Interfaces.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize(Roles = "AdminEmpresa,Gerente")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        // Devuelve indicadores de cotizaciones, aceptacion y ventas por periodo.
        [HttpGet("sales")]
        public async Task<IActionResult> GetSalesReport([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var report = await _reportService.GetSalesReportAsync(from, to);
            return Ok(report);
        }

        // Devuelve salud del pipeline, oportunidades abiertas y distribuciones comerciales.
        [HttpGet("pipeline")]
        public async Task<IActionResult> GetPipelineReport()
        {
            var report = await _reportService.GetPipelineReportAsync();
            return Ok(report);
        }

        // Devuelve productividad de usuarios comerciales por periodo.
        [HttpGet("productivity")]
        public async Task<IActionResult> GetProductivityReport([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var report = await _reportService.GetProductivityReportAsync(from, to);
            return Ok(report);
        }

        // Devuelve valor comercial, origen y distribucion de clientes por periodo.
        [HttpGet("customers")]
        public async Task<IActionResult> GetCustomerReport([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var report = await _reportService.GetCustomerReportAsync(from, to);
            return Ok(report);
        }
    }
}
