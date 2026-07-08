using LeadFlow.Application.DTOs.Auth;
using LeadFlow.Application.Common.Email;
using LeadFlow.Application.Common.Security;
using LeadFlow.Application.Common.Validation;
using LeadFlow.Application.Interfaces.AuditLogs;
using LeadFlow.Application.Interfaces.Auth;
using LeadFlow.Application.Interfaces.Common;
using LeadFlow.Domain.Entities;
using LeadFlow.Infrastructure.Data;
using LeadFlow.Infrastructure.Services.Email;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;

namespace LeadFlow.Infrastructure.Services.Auth
{
    // Servicio principal de autenticacion: registra empresas, valida usuarios y genera tokens.
    public class AuthService : IAuthService
    {
        private readonly LeadFlowDbContext _context;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditLogService _auditLogService;
        private readonly IConfiguration _configuration;
        private readonly IEmailSender _emailSender;
        private readonly ILogger<AuthService> _logger;
        private readonly PasswordHasher<User> _passwordHasher;

        private const int EmailVerificationCodeExpirationMinutes = 15;
        private const int MaxEmailVerificationAttempts = 5;

        public AuthService(
            LeadFlowDbContext context,
            IJwtTokenService jwtTokenService,
            ICurrentUserService currentUserService,
            IAuditLogService auditLogService,
            IConfiguration configuration,
            IEmailSender emailSender,
            ILogger<AuthService> logger)
        {
            _context = context;
            _jwtTokenService = jwtTokenService;
            _currentUserService = currentUserService;
            _auditLogService = auditLogService;
            _configuration = configuration;
            _emailSender = emailSender;
            _logger = logger;
            _passwordHasher = new PasswordHasher<User>();
        }

        public async Task<RegisterCompanyResponse> RegisterCompanyAsync(RegisterCompanyRequest request)
        {
            ValidateRegisterCompanyRequest(request);

            var adminEmail = InputValidator.NormalizeRequiredEmail(request.AdminEmail, "El correo del administrador");
            var companyName = InputValidator.NormalizeRequiredText(request.CompanyName, "El nombre de la empresa", minLength: 3, maxLength: 150);
            var adminFullName = InputValidator.NormalizeRequiredText(request.AdminFullName, "El nombre del administrador", minLength: 3, maxLength: 150);

            var emailAlreadyExists = await _context.Users
                .AnyAsync(user => user.Email == adminEmail);

            if (emailAlreadyExists)
            {
                throw new InvalidOperationException("Ya existe un usuario registrado con ese correo.");
            }

            var company = new Company
            {
                Name = companyName,
                Email = adminEmail,
                DefaultCurrency = "CRC",
                DefaultTaxRate = 13,
                QuotePrefix = "LF",
                DefaultQuoteTerms = "Validez de 15 dias. Precios sujetos a confirmacion final.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            await AddDefaultLeadStatusesAsync(company.Id);

            var adminUser = new User
            {
                CompanyId = company.Id,
                FullName = adminFullName,
                Email = adminEmail,
                Role = "AdminEmpresa",
                IsActive = true,
                IsEmailVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            adminUser.PasswordHash = _passwordHasher.HashPassword(adminUser, request.Password.Trim());

            // Generamos el código de verificación (guardamos solo el hash) y lo enviamos por correo.
            var verificationCode = GenerateSixDigitCode();
            adminUser.EmailVerificationCodeHash = HashToken(verificationCode);
            adminUser.EmailVerificationCodeExpiresAt = DateTime.UtcNow.AddMinutes(EmailVerificationCodeExpirationMinutes);
            adminUser.EmailVerificationAttempts = 0;

            _context.Users.Add(adminUser);
            await _context.SaveChangesAsync();

            await SendVerificationCodeAsync(adminUser, verificationCode);

            return new RegisterCompanyResponse
            {
                Message = "Cuenta creada. Te enviamos un código de verificación a tu correo.",
                Email = adminUser.Email,
                RequiresEmailVerification = true
            };
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var email = InputValidator.NormalizeRequiredEmail(request.Email, "El correo");

            var user = await _context.Users
                .Include(user => user.Company)
                .FirstOrDefaultAsync(user => user.Email == email);

            if (user is null)
            {
                throw new UnauthorizedAccessException("Credenciales invalidas.");
            }

            if (!user.IsActive)
            {
                throw new UnauthorizedAccessException("El usuario esta inactivo.");
            }

            if (user.LockedUntil != null && user.LockedUntil > DateTime.UtcNow)
            {
                throw new UnauthorizedAccessException("La cuenta esta bloqueada temporalmente por demasiados intentos fallidos.");
            }

            if (!user.Company.IsActive)
            {
                throw new UnauthorizedAccessException("La empresa esta inactiva.");
            }

            var passwordResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password
            );
            //Control de intentos 
            if (passwordResult == PasswordVerificationResult.Failed)
            {
                user.FailedLoginAttempts++;

                if (user.FailedLoginAttempts >= GetMaxFailedLoginAttempts())
                {
                    user.LockedUntil = DateTime.UtcNow.AddMinutes(GetAccountLockoutMinutes());
                    user.FailedLoginAttempts = 0;
                }

                await _context.SaveChangesAsync();

                throw new UnauthorizedAccessException("Credenciales invalidas.");
            }
            // Si la contrasena es correcta, limpia el bloqueo y reinicia los intentos fallidos.
            user.FailedLoginAttempts = 0;
            user.LockedUntil = null;

            await _context.SaveChangesAsync();

            // Bloqueamos el acceso hasta que el correo esté verificado (las credenciales ya son válidas).
            if (!user.IsEmailVerified)
            {
                throw new UnauthorizedAccessException(
                    "Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja o solicita un nuevo código.");
            }

            return await BuildAuthResponseAsync(user);

        }



        public async Task<MessageResponse> ChangePasswordAsync(ChangePasswordRequest request)
        {
            var userId = GetCurrentUserId();
            ValidateChangePasswordRequest(request);

            var user = await _context.Users
                .FirstOrDefaultAsync(user => user.Id == userId && user.IsActive);

            if (user is null)
            {
                throw new UnauthorizedAccessException("Usuario no encontrado o inactivo.");
            }

            var currentPasswordResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.CurrentPassword
            );

            if (currentPasswordResult == PasswordVerificationResult.Failed)
            {
                throw new InvalidOperationException("La contrasena actual no es correcta.");
            }

            var newPasswordResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.NewPassword
            );

            if (newPasswordResult != PasswordVerificationResult.Failed)
            {
                throw new InvalidOperationException("La nueva contrasena debe ser diferente a la actual.");
            }

            user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword.Trim());
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(
                "ChangePassword",
                "User",
                user.Id,
                $"El usuario {user.Email} cambio su contrasena.");

            return new MessageResponse
            {
                Message = "Contrasena actualizada correctamente."
            };
        }

        public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                throw new InvalidOperationException("El refresh token es requerido.");
            }

            var refreshToken = request.RefreshToken.Trim();
            var refreshTokenHash = HashToken(refreshToken);

            var storedToken = await _context.RefreshTokens
                .Include(refreshToken => refreshToken.User)
                .ThenInclude(user => user.Company)
                .FirstOrDefaultAsync(refreshToken => refreshToken.TokenHash == refreshTokenHash);

            if (storedToken is null)
            {
                throw new UnauthorizedAccessException("Refresh token invalido o expirado.");
            }

            if (storedToken.RevokedAt is not null)
            {
                await RevokeActiveRefreshTokensAsync(storedToken.UserId);
                throw new UnauthorizedAccessException("Sesion revocada por seguridad. Inicia sesion nuevamente.");
            }

            if (!storedToken.IsActive)
            {
                throw new UnauthorizedAccessException("Refresh token invalido o expirado.");
            }

            if (!storedToken.User.IsActive || !storedToken.User.Company.IsActive)
            {
                throw new UnauthorizedAccessException("Usuario o empresa inactiva.");
            }

            var newRefreshToken = GenerateRefreshToken();
            var newRefreshTokenHash = HashToken(newRefreshToken);
            var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTokenExpirationDays());

            storedToken.RevokedAt = DateTime.UtcNow;
            storedToken.ReplacedByTokenHash = newRefreshTokenHash;

            _context.RefreshTokens.Add(new RefreshToken
            {
                CompanyId = storedToken.User.CompanyId,
                UserId = storedToken.UserId,
                TokenHash = newRefreshTokenHash,
                ExpiresAt = refreshTokenExpiresAt,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return BuildAuthResponse(storedToken.User, newRefreshToken, refreshTokenExpiresAt);
        }

        public async Task<MessageResponse> RevokeRefreshTokenAsync(RevokeRefreshTokenRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                throw new InvalidOperationException("El refresh token es requerido.");
            }

            var refreshToken = request.RefreshToken.Trim();
            var refreshTokenHash = HashToken(refreshToken);

            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(refreshToken => refreshToken.TokenHash == refreshTokenHash);

            if (storedToken is not null && storedToken.RevokedAt is null)
            {
                storedToken.RevokedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return new MessageResponse
            {
                Message = "Sesion cerrada correctamente."
            };
        }

        public async Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
        {
            var neutralResponse = new ForgotPasswordResponse
            {
                Message = "Si el correo existe y esta activo, se generara una instruccion para recuperar la contrasena."
            };

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return neutralResponse;
            }

            var normalizedEmail = InputValidator.NormalizeRequiredEmail(request.Email, "El correo");

            var user = await _context.Users
                .Include(user => user.Company)
                .FirstOrDefaultAsync(user =>
                    user.Email == normalizedEmail &&
                    user.IsActive &&
                    user.Company.IsActive);

            if (user is null)
            {
                return neutralResponse;
            }

            var resetToken = GenerateRefreshToken();
            var expiresAt = DateTime.UtcNow.AddMinutes(GetPasswordResetTokenExpirationMinutes());

            _context.PasswordResetTokens.Add(new PasswordResetToken
            {
                CompanyId = user.CompanyId,
                UserId = user.Id,
                TokenHash = HashToken(resetToken),
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // Enviamos el enlace por correo. Si el SMTP falla, lo registramos pero devolvemos
            // la misma respuesta neutral para no revelar si el correo existe ni romper la request.
            try
            {
                var appBaseUrl = (_configuration.GetSection("EmailSettings")["AppBaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
                var resetLink = $"{appBaseUrl}/reset-password?token={Uri.EscapeDataString(resetToken)}";

                await _emailSender.SendAsync(new EmailMessage
                {
                    ToEmail = user.Email,
                    ToName = user.FullName,
                    Subject = "Restablecé tu contraseña - LeadFlow",
                    HtmlBody = EmailTemplates.PasswordReset(user.FullName, resetLink, GetPasswordResetTokenExpirationMinutes())
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "No se pudo enviar el correo de recuperación a {Email}.", user.Email);
            }

            return neutralResponse;
        }

        public async Task<MessageResponse> ResetPasswordAsync(ResetPasswordRequest request)
        {
            ValidateResetPasswordRequest(request);

            var tokenHash = HashToken(request.Token);

            var storedToken = await _context.PasswordResetTokens
                .Include(resetToken => resetToken.User)
                .ThenInclude(user => user.Company)
                .FirstOrDefaultAsync(resetToken => resetToken.TokenHash == tokenHash);

            if (storedToken is null || !storedToken.IsActive)
            {
                throw new UnauthorizedAccessException("Token de recuperacion invalido o expirado.");
            }

            if (!storedToken.User.IsActive || !storedToken.User.Company.IsActive)
            {
                throw new UnauthorizedAccessException("Usuario o empresa inactiva.");
            }

            storedToken.User.PasswordHash = _passwordHasher.HashPassword(storedToken.User, request.NewPassword.Trim());
            storedToken.User.FailedLoginAttempts = 0;
            storedToken.User.LockedUntil = null;
            storedToken.User.UpdatedAt = DateTime.UtcNow;
            storedToken.UsedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new MessageResponse
            {
                Message = "Contrasena restablecida correctamente."
            };
        }

        public async Task<MessageResponse> VerifyEmailAsync(VerifyEmailRequest request)
        {
            var email = InputValidator.NormalizeRequiredEmail(request.Email, "El correo");
            var code = (request.Code ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(code))
            {
                throw new InvalidOperationException("El código de verificación es requerido.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user is null)
            {
                throw new UnauthorizedAccessException("No encontramos una cuenta con ese correo.");
            }

            if (user.IsEmailVerified)
            {
                return new MessageResponse { Message = "Tu correo ya estaba verificado. Podés iniciar sesión." };
            }

            if (user.EmailVerificationCodeHash is null ||
                user.EmailVerificationCodeExpiresAt is null ||
                user.EmailVerificationCodeExpiresAt <= DateTime.UtcNow)
            {
                throw new UnauthorizedAccessException("El código expiró o no es válido. Solicita uno nuevo.");
            }

            if (user.EmailVerificationAttempts >= MaxEmailVerificationAttempts)
            {
                // Invalidamos el código para forzar el reenvío.
                user.EmailVerificationCodeHash = null;
                user.EmailVerificationCodeExpiresAt = null;
                await _context.SaveChangesAsync();
                throw new UnauthorizedAccessException("Demasiados intentos. Solicita un nuevo código.");
            }

            if (user.EmailVerificationCodeHash != HashToken(code))
            {
                user.EmailVerificationAttempts++;
                await _context.SaveChangesAsync();
                throw new UnauthorizedAccessException("Código incorrecto. Revisa e intenta de nuevo.");
            }

            user.IsEmailVerified = true;
            user.EmailVerifiedAt = DateTime.UtcNow;
            user.EmailVerificationCodeHash = null;
            user.EmailVerificationCodeExpiresAt = null;
            user.EmailVerificationAttempts = 0;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new MessageResponse { Message = "Correo verificado correctamente. Ya podés iniciar sesión." };
        }

        public async Task<MessageResponse> ResendVerificationAsync(ResendVerificationRequest request)
        {
            // Respuesta neutral para no revelar si el correo existe.
            var neutral = new MessageResponse
            {
                Message = "Si la cuenta existe y aún no está verificada, te enviamos un nuevo código."
            };

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return neutral;
            }

            var email = InputValidator.NormalizeRequiredEmail(request.Email, "El correo");
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user is null || user.IsEmailVerified)
            {
                return neutral;
            }

            var code = GenerateSixDigitCode();
            user.EmailVerificationCodeHash = HashToken(code);
            user.EmailVerificationCodeExpiresAt = DateTime.UtcNow.AddMinutes(EmailVerificationCodeExpirationMinutes);
            user.EmailVerificationAttempts = 0;

            await _context.SaveChangesAsync();

            await SendVerificationCodeAsync(user, code);

            return neutral;
        }

        private async Task SendVerificationCodeAsync(User user, string code)
        {
            // Si el SMTP falla, lo registramos pero no rompemos el registro (el usuario puede reenviar).
            try
            {
                await _emailSender.SendAsync(new EmailMessage
                {
                    ToEmail = user.Email,
                    ToName = user.FullName,
                    Subject = "Verificá tu correo - LeadFlow",
                    HtmlBody = EmailTemplates.EmailVerification(user.FullName, code, EmailVerificationCodeExpirationMinutes)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "No se pudo enviar el código de verificación a {Email}.", user.Email);
            }
        }

        private static string GenerateSixDigitCode()
        {
            return RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        }

        private async Task<AuthResponse> BuildAuthResponseAsync(User user)
        {
            var refreshToken = GenerateRefreshToken();
            var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTokenExpirationDays());

            _context.RefreshTokens.Add(new RefreshToken
            {
                CompanyId = user.CompanyId,
                UserId = user.Id,
                TokenHash = HashToken(refreshToken),
                ExpiresAt = refreshTokenExpiresAt,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return BuildAuthResponse(user, refreshToken, refreshTokenExpiresAt);
        }

        private AuthResponse BuildAuthResponse(User user, string refreshToken, DateTime refreshTokenExpiresAt)
        {
            return new AuthResponse
            {
                Token = _jwtTokenService.GenerateToken(user),
                RefreshToken = refreshToken,
                TokenExpiresAt = DateTime.UtcNow.AddMinutes(GetAccessTokenExpirationMinutes()),
                RefreshTokenExpiresAt = refreshTokenExpiresAt,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                CompanyId = user.CompanyId
            };
        }

        private async Task AddDefaultLeadStatusesAsync(int companyId)
        {
            var hasPipeline = await _context.LeadStatuses
                .AnyAsync(status => status.CompanyId == companyId);

            if (hasPipeline)
            {
                return;
            }

            // Crea un pipeline comercial inicial para que cada empresa nueva pueda gestionar leads desde el primer uso.
            var defaultStatuses = new List<LeadStatus>
            {
                new()
                {
                    CompanyId = companyId,
                    Name = "Nuevo",
                    Description = "Lead recien ingresado al proceso comercial.",
                    Color = "#2563EB",
                    SortOrder = 1,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    CompanyId = companyId,
                    Name = "Contactado",
                    Description = "Lead que ya tuvo un primer contacto comercial.",
                    Color = "#0EA5E9",
                    SortOrder = 2,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    CompanyId = companyId,
                    Name = "En seguimiento",
                    Description = "Lead que requiere seguimiento antes de avanzar.",
                    Color = "#F59E0B",
                    SortOrder = 3,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    CompanyId = companyId,
                    Name = "Cotizacion enviada",
                    Description = "Lead con una cotizacion enviada al cliente.",
                    Color = "#8B5CF6",
                    SortOrder = 4,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    CompanyId = companyId,
                    Name = "Negociacion",
                    Description = "Lead en negociacion comercial activa.",
                    Color = "#F97316",
                    SortOrder = 5,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    CompanyId = companyId,
                    Name = "Ganado",
                    Description = "Lead convertido en venta u oportunidad ganada.",
                    Color = "#16A34A",
                    SortOrder = 6,
                    IsWon = true,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    CompanyId = companyId,
                    Name = "Perdido",
                    Description = "Lead cerrado sin venta.",
                    Color = "#DC2626",
                    SortOrder = 7,
                    IsLost = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            _context.LeadStatuses.AddRange(defaultStatuses);
            await _context.SaveChangesAsync();
        }

        private int GetCurrentUserId()
        {
            return _currentUserService.UserId
                ?? throw new UnauthorizedAccessException("No se pudo identificar el usuario autenticado.");
        }

        private async Task RevokeActiveRefreshTokensAsync(int userId)
        {
            // Revoca sesiones activas si se detecta reutilizacion de un refresh token ya revocado.
            var activeTokens = await _context.RefreshTokens
                .Where(refreshToken =>
                    refreshToken.UserId == userId &&
                    refreshToken.RevokedAt == null &&
                    refreshToken.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.RevokedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        private static void ValidateRegisterCompanyRequest(RegisterCompanyRequest request)
        {
            InputValidator.NormalizeRequiredText(request.CompanyName, "El nombre de la empresa", minLength: 3, maxLength: 150);
            InputValidator.NormalizeRequiredText(request.AdminFullName, "El nombre del administrador", minLength: 3, maxLength: 150);
            InputValidator.NormalizeRequiredEmail(request.AdminEmail, "El correo del administrador");
            PasswordPolicy.ValidateOrThrow(request.Password);
        }

        private static void ValidateChangePasswordRequest(ChangePasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
            {
                throw new InvalidOperationException("La contrasena actual es requerida.");
            }

            PasswordPolicy.ValidateOrThrow(request.NewPassword);

            if (request.NewPassword != request.ConfirmNewPassword)
            {
                throw new InvalidOperationException("La confirmacion de la nueva contrasena no coincide.");
            }
        }

        private static void ValidateResetPasswordRequest(ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Token))
            {
                throw new InvalidOperationException("El token de recuperacion es requerido.");
            }

            PasswordPolicy.ValidateOrThrow(request.NewPassword);

            if (request.NewPassword != request.ConfirmNewPassword)
            {
                throw new InvalidOperationException("La confirmacion de la nueva contrasena no coincide.");
            }
        }

        private int GetAccessTokenExpirationMinutes()
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            return int.Parse(jwtSettings["ExpirationMinutes"]!);
        }

        private int GetRefreshTokenExpirationDays()
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            return int.TryParse(jwtSettings["RefreshTokenExpirationDays"], out var days)
                ? days
                : 7;
        }

        private int GetPasswordResetTokenExpirationMinutes()
        {
            var securitySettings = _configuration.GetSection("SecuritySettings");

            return int.TryParse(securitySettings["PasswordResetTokenExpirationMinutes"], out var minutes)
                ? minutes
                : 30;
        }

        private int GetMaxFailedLoginAttempts()
        {
            var securitySettings = _configuration.GetSection("SecuritySettings");

            return int.TryParse(securitySettings["MaxFailedLoginAttempts"], out var attempts)
                ? attempts
                : 5;
        }

        private int GetAccountLockoutMinutes()
        {
            var securitySettings = _configuration.GetSection("SecuritySettings");

            return int.TryParse(securitySettings["AccountLockoutMinutes"], out var minutes)
                ? minutes
                : 15;
        }

        private static string GenerateRefreshToken()
        {
            var randomBytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(randomBytes);
        }

        private static string HashToken(string token)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToBase64String(bytes);
        }
    }
}

