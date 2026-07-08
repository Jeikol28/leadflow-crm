namespace LeadFlow.Application.DTOs.Auth
{
    // Confirma el correo de una cuenta usando el código de 6 dígitos enviado al registrarse.
    public class VerifyEmailRequest
    {
        public string Email { get; set; } = string.Empty;

        public string Code { get; set; } = string.Empty;
    }
}
