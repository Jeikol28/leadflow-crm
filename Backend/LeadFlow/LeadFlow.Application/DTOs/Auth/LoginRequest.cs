//Este DTO representa los datos que el usuario enviará para iniciar sesión.
namespace LeadFlow.Application.DTOs.Auth
{
    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }
}