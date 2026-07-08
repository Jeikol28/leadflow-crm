namespace LeadFlow.Application.DTOs.Auth
{
    // Cambia la contrasena usando un token de recuperacion valido y no usado.
    public class ResetPasswordRequest
    {
        public string Token { get; set; } = string.Empty;

        public string NewPassword { get; set; } = string.Empty;

        public string ConfirmNewPassword { get; set; } = string.Empty;
    }
}
