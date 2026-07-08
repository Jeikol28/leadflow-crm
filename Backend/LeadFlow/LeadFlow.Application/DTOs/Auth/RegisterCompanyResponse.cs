namespace LeadFlow.Application.DTOs.Auth
{
    // Respuesta del registro: la cuenta se crea sin sesión hasta verificar el correo.
    public class RegisterCompanyResponse
    {
        public string Message { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public bool RequiresEmailVerification { get; set; } = true;
    }
}
