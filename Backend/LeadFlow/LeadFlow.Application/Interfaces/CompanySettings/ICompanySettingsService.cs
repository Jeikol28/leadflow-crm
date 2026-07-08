using LeadFlow.Application.DTOs.CompanySettings;

namespace LeadFlow.Application.Interfaces.CompanySettings
{
    // Define lectura y actualizacion de la configuracion de empresa.
    public interface ICompanySettingsService
    {
        Task<CompanySettingsResponse?> GetCurrentCompanyAsync();

        Task<CompanySettingsResponse?> UpdateCurrentCompanyAsync(UpdateCompanySettingsRequest request);
    }
}
