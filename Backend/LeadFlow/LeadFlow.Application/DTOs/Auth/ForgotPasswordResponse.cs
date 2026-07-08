namespace LeadFlow.Application.DTOs.Auth
{
    // Devuelve una respuesta neutral y, en desarrollo, el token para probar el flujo desde Swagger.
    public class ForgotPasswordResponse
    {
        public string Message { get; set; } = string.Empty;

        public string? ResetToken { get; set; }

        public DateTime? ExpiresAt { get; set; }
    }
}
