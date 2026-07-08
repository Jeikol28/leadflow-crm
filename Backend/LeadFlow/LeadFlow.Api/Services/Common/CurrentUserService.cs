using System.Security.Claims;
using LeadFlow.Application.Interfaces.Common;

namespace LeadFlow.Api.Services.Common
{
    // Lee los claims del JWT para obtener informacion del usuario autenticado.
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? UserId
        {
            get
            {
                var value = _httpContextAccessor.HttpContext?.User
                    .FindFirstValue(ClaimTypes.NameIdentifier);

                return int.TryParse(value, out var userId) ? userId : null;
            }
        }

        public int? CompanyId
        {
            get
            {
                var value = _httpContextAccessor.HttpContext?.User
                    .FindFirstValue("CompanyId");

                return int.TryParse(value, out var companyId) ? companyId : null;
            }
        }

        public string? Email =>
            _httpContextAccessor.HttpContext?.User
                .FindFirstValue(ClaimTypes.Email);

        public string? Role =>
            _httpContextAccessor.HttpContext?.User
                .FindFirstValue(ClaimTypes.Role);

        public bool IsAuthenticated =>
            _httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
    }
}