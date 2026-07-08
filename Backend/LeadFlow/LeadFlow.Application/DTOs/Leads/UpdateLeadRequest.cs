//Este DTO representa los datos para editar un lead.
namespace LeadFlow.Application.DTOs.Leads
{
    public class UpdateLeadRequest
    {
        public int CustomerId { get; set; }

        public int? AssignedUserId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Status { get; set; } = "Nuevo";

        public string Priority { get; set; } = "Media";

        public decimal? EstimatedAmount { get; set; }

        public int CloseProbability { get; set; }

        public DateTime? ExpectedCloseDate { get; set; }

        public DateTime? LastContactedAt { get; set; }
    }
}