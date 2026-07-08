//Esta interfaz define lo que debe poder hacer el servicio de autenticación.
using LeadFlow.Application.DTOs.Auth;

namespace LeadFlow.Application.Interfaces.Auth
{
    public interface IAuthService
    {
        Task<RegisterCompanyResponse> RegisterCompanyAsync(RegisterCompanyRequest request);

        Task<AuthResponse> LoginAsync(LoginRequest request);

        Task<MessageResponse> VerifyEmailAsync(VerifyEmailRequest request);

        Task<MessageResponse> ResendVerificationAsync(ResendVerificationRequest request);

        Task<MessageResponse> ChangePasswordAsync(ChangePasswordRequest request);

        Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request);

        Task<MessageResponse> RevokeRefreshTokenAsync(RevokeRefreshTokenRequest request);

        Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request);

        Task<MessageResponse> ResetPasswordAsync(ResetPasswordRequest request);
    }
}
