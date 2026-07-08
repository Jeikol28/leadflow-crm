using LeadFlow.Application.Interfaces.AuditLogs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/audit-logs")]
    [Authorize(Roles = "AdminEmpresa,Gerente")]
    public class AuditLogsController : ControllerBase
    {
        private readonly IAuditLogService _auditLogService;

        public AuditLogsController(IAuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        // Consulta la bitacora de auditoria de la empresa autenticada.
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] string? entityName,
            [FromQuery] string? action,
            [FromQuery] LeadFlow.Application.DTOs.Common.PagedRequest request)
        {
            var auditLogs = await _auditLogService.GetAllAsync(from, to, entityName, action, request);
            return Ok(auditLogs);
        }
    }
}
