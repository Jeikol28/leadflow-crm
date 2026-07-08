//Este DTO representa los datos que el frontend enviará cuando una empresa se registre.
namespace LeadFlow.Application.DTOs.Auth
{
    public class RegisterCompanyRequest
    {
        public string CompanyName { get; set; } = string.Empty;

        public string AdminFullName { get; set; } = string.Empty;

        public string AdminEmail { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }
}