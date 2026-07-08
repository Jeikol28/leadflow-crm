using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LeadFlow.Application.Interfaces.Auth;
using LeadFlow.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace LeadFlow.Infrastructure.ExternalServices.Auth
{
    // Servicio encargado de generar tokens JWT para usuarios autenticados.
    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _configuration;

        public JwtTokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");

            var secretKey = jwtSettings["SecretKey"]!;
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            // Usa 120 minutos por defecto si el valor falta o no es numerico (evita fallos en runtime).
            var expirationMinutes = int.TryParse(jwtSettings["ExpirationMinutes"], out var parsedMinutes)
                ? parsedMinutes
                : 120;

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim("CompanyId", user.CompanyId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(ClaimTypes.Name, user.FullName)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}