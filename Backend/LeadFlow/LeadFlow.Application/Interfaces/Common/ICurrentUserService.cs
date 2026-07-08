//Esta interfaz define cómo vamos a obtener los datos del usuario autenticado desde el JWT.
namespace LeadFlow.Application.Interfaces.Common
{
    public interface ICurrentUserService
    {
        int? UserId { get; }

        int? CompanyId { get; }

        string? Email { get; }

        string? Role { get; }

        bool IsAuthenticated { get; }
    }
}