using LeadFlow.Application.DTOs.Auth;
using LeadFlow.Application.Interfaces.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LeadFlow.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // Registra una empresa nueva junto con su usuario administrador.
        [HttpPost("register-company")]
        [EnableRateLimiting("AuthSensitiveRateLimitPolicy")]
        public async Task<IActionResult> RegisterCompany(RegisterCompanyRequest request)
        {
            try
            {
                var response = await _authService.RegisterCompanyAsync(request);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

       
        [EnableRateLimiting("LoginRateLimitPolicy")]//límite de 5 intentos por minuto únicamente al login.
        // Valida credenciales de usuario y devuelve un token JWT.
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            try
            {
                var response = await _authService.LoginAsync(request);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new
                {
                    message = ex.Message
                });
            }
        }

        // Permite que un usuario autenticado cambie su contrasena validando la actual.
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
        {
            var response = await _authService.ChangePasswordAsync(request);
            return Ok(response);
        }

        // Inicia recuperacion de contrasena sin revelar si el correo existe.
        [HttpPost("forgot-password")]
        [EnableRateLimiting("AuthSensitiveRateLimitPolicy")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
        {
            var response = await _authService.ForgotPasswordAsync(request);
            return Ok(response);
        }

        // Restablece la contrasena usando un token valido de un solo uso.
        [HttpPost("reset-password")]
        [EnableRateLimiting("AuthSensitiveRateLimitPolicy")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
        {
            try
            {
                var response = await _authService.ResetPasswordAsync(request);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new
                {
                    message = ex.Message
                });
            }
        }

        // Verifica el correo del usuario con el codigo de 6 digitos enviado al registrarse.
        [HttpPost("verify-email")]
        [EnableRateLimiting("AuthSensitiveRateLimitPolicy")]
        public async Task<IActionResult> VerifyEmail(VerifyEmailRequest request)
        {
            try
            {
                var response = await _authService.VerifyEmailAsync(request);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        // Reenvia un nuevo codigo de verificacion (respuesta neutral).
        [HttpPost("resend-verification")]
        [EnableRateLimiting("AuthSensitiveRateLimitPolicy")]
        public async Task<IActionResult> ResendVerification(ResendVerificationRequest request)
        {
            var response = await _authService.ResendVerificationAsync(request);
            return Ok(response);
        }

        // Renueva la sesion usando un refresh token valido y revoca el anterior.
        [HttpPost("refresh-token")]
        [EnableRateLimiting("AuthSensitiveRateLimitPolicy")]
        public async Task<IActionResult> RefreshToken(RefreshTokenRequest request)
        {
            var response = await _authService.RefreshTokenAsync(request);
            return Ok(response);
        }

        // Cierra la sesion revocando el refresh token indicado.
        [HttpPost("logout")]
        [EnableRateLimiting("AuthSensitiveRateLimitPolicy")]
        public async Task<IActionResult> Logout(RevokeRefreshTokenRequest request)
        {
            var response = await _authService.RevokeRefreshTokenAsync(request);
            return Ok(response);
        }
    }
}

