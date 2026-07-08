using LeadFlow.Application.Interfaces.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/current-user")]
    [Authorize]
    public class CurrentUserController : ControllerBase
    {
        private readonly ICurrentUserService _currentUserService;

        public CurrentUserController(ICurrentUserService currentUserService)
        {
            _currentUserService = currentUserService;
        }

        // Endpoint temporal para validar que la API puede leer los datos del JWT.
        [HttpGet]
        public IActionResult GetCurrentUser()
        {
            return Ok(new
            {
                userId = _currentUserService.UserId,
                companyId = _currentUserService.CompanyId,
                email = _currentUserService.Email,
                role = _currentUserService.Role,
                isAuthenticated = _currentUserService.IsAuthenticated
            });
        }
    }
}