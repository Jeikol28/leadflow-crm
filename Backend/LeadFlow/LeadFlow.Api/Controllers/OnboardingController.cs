using LeadFlow.Application.Interfaces.Onboarding;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/onboarding")]
    [Authorize]
    public class OnboardingController : ControllerBase
    {
        private readonly IOnboardingService _onboardingService;

        public OnboardingController(IOnboardingService onboardingService)
        {
            _onboardingService = onboardingService;
        }

        // Devuelve el checklist de activacion inicial para guiar a empresas nuevas dentro del SaaS.
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var status = await _onboardingService.GetStatusAsync();
            return Ok(status);
        }
    }
}
