//Este DTO será la respuesta cuando alguien se registre o inicie sesión correctamente.
namespace LeadFlow.Application.DTOs.Auth
{
    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;

        public string RefreshToken { get; set; } = string.Empty;

        public DateTime TokenExpiresAt { get; set; }

        public DateTime RefreshTokenExpiresAt { get; set; }

        public string Email { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public int CompanyId { get; set; }
    }
}
