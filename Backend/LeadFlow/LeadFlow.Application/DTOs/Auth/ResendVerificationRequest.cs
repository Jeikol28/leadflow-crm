namespace LeadFlow.Application.DTOs.Auth
{
    // Solicita el reenvío de un nuevo código de verificación de correo.
    public class ResendVerificationRequest
    {
        public string Email { get; set; } = string.Empty;
    }
}
