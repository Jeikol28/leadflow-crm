namespace LeadFlow.Application.DTOs.Auth
{
    // Solicita iniciar el flujo de recuperacion de contrasena para un correo.
    public class ForgotPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
    }
}
