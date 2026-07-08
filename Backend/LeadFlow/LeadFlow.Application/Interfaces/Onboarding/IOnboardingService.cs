using LeadFlow.Application.DTOs.Onboarding;

namespace LeadFlow.Application.Interfaces.Onboarding
{
    // Define el checklist de configuracion inicial que ayuda a activar una empresa nueva.
    public interface IOnboardingService
    {
        Task<OnboardingStatusResponse> GetStatusAsync();
    }
}
