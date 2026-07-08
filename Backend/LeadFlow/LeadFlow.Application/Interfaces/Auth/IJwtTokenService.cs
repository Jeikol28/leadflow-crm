//Esta interfaz define un servicio encargado de generar el token JWT.
using LeadFlow.Domain.Entities;

namespace LeadFlow.Application.Interfaces.Auth
{
    public interface IJwtTokenService
    {
        string GenerateToken(User user);
    }
}
