//Este DTO recibe los datos para registrar una interacción.

namespace LeadFlow.Application.DTOs.Interactions
{
    public class CreateInteractionRequest
    {
        public int? CustomerId { get; set; }

        public int? LeadId { get; set; }

        public string Type { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime? InteractionDate { get; set; }
    }
}