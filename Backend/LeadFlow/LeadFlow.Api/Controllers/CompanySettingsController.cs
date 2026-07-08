using LeadFlow.Application.DTOs.CompanySettings;
using LeadFlow.Application.Interfaces.CompanySettings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/company-settings")]
    [Authorize]
    public class CompanySettingsController : ControllerBase
    {
        private readonly ICompanySettingsService _companySettingsService;

        public CompanySettingsController(ICompanySettingsService companySettingsService)
        {
            _companySettingsService = companySettingsService;
        }

        // Devuelve la configuracion de la empresa autenticada.
        [HttpGet]
        public async Task<IActionResult> GetCurrentCompany()
        {
            var company = await _companySettingsService.GetCurrentCompanyAsync();

            if (company is null)
            {
                return NotFound(new
                {
                    message = "Empresa no encontrada."
                });
            }

            return Ok(company);
        }

        // Actualiza datos fiscales y comerciales usados por el SaaS.
        [HttpPut]
        [Authorize(Roles = "AdminEmpresa")]
        public async Task<IActionResult> UpdateCurrentCompany(UpdateCompanySettingsRequest request)
        {
            var company = await _companySettingsService.UpdateCurrentCompanyAsync(request);

            if (company is null)
            {
                return NotFound(new
                {
                    message = "Empresa no encontrada."
                });
            }

            return Ok(company);
        }
    }
}
