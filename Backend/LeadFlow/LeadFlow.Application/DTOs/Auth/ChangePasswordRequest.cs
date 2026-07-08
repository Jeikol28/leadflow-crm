namespace LeadFlow.Application.DTOs.Auth
{
    // Recibe los datos necesarios para que un usuario autenticado cambie su contrasena.
    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;

        public string NewPassword { get; set; } = string.Empty;

        public string ConfirmNewPassword { get; set; } = string.Empty;
    }
}
