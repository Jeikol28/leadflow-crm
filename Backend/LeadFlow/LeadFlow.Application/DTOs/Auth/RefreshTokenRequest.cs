namespace LeadFlow.Application.DTOs.Auth
{
    // Recibe un refresh token valido para emitir una nueva sesion.
    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}
