namespace LeadFlow.Application.DTOs.Onboarding
{
    // Resume el avance de configuracion inicial de una empresa para mostrarlo en el frontend.
    public class OnboardingStatusResponse
    {
        public int TotalSteps { get; set; }

        public int CompletedSteps { get; set; }

        public int CompletionPercentage { get; set; }

        public bool IsComplete { get; set; }

        public string? NextStepKey { get; set; }

        public string? NextStepTitle { get; set; }

        public List<OnboardingStepResponse> Steps { get; set; } = new();
    }
}
