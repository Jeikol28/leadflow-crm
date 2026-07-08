namespace LeadFlow.Application.DTOs.Auth
{
    // Recibe el refresh token que se desea cerrar o revocar.
    public class RevokeRefreshTokenRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}
