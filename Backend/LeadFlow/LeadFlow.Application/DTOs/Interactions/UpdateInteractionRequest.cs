//Este DTO permite editar una interacción.

namespace LeadFlow.Application.DTOs.Interactions
{
    public class UpdateInteractionRequest
    {
        public string Type { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime? InteractionDate { get; set; }
    }
}