namespace LeadFlow.Application.DTOs.Onboarding
{
    // Representa una tarea del checklist inicial que ayuda a configurar la empresa dentro del SaaS.
    public class OnboardingStepResponse
    {
        public string Key { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Module { get; set; } = string.Empty;

        public string ActionEndpoint { get; set; } = string.Empty;

        public int SortOrder { get; set; }

        public int CompletedValue { get; set; }

        public bool IsCompleted { get; set; }
    }
}
