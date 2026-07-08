using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LeadFlow.Api.Controllers
{
    // Controlador de apoyo SOLO para desarrollo: excluido por completo de las
    // compilaciones Release (produccion) mediante la directiva #if DEBUG.
#if DEBUG
    [ApiController]
    [Route("api/database-test")]
    [Authorize(Roles = "AdminEmpresa")]
    public class DatabaseTestController : ControllerBase
    {
        private readonly LeadFlowDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IWebHostEnvironment _environment;

        public DatabaseTestController(
            LeadFlowDbContext context,
            ICurrentUserService currentUserService,
            IWebHostEnvironment environment)
        {
            _context = context;
            _currentUserService = currentUserService;
            _environment = environment;
        }

        // Endpoint temporal de desarrollo para verificar la conexion sin exponer empresas ajenas.
        [HttpGet("companies")]
        public async Task<IActionResult> GetCompanies()
        {
            if (!_environment.IsDevelopment())
            {
                return NotFound();
            }

            var companyId = _currentUserService.CompanyId
                ?? throw new UnauthorizedAccessException("No se pudo identificar la empresa del usuario autenticado.");

            var companies = await _context.Companies
                .Where(company => company.Id == companyId)
                .Select(company => new
                {
                    company.Id,
                    company.Name,
                    company.Email,
                    company.Phone,
                    company.IsActive
                })
                .ToListAsync();

            return Ok(companies);
        }
    }
#endif
}
