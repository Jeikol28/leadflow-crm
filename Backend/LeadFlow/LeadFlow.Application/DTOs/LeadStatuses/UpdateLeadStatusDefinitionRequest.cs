//Este DTO sirve para editar la definición de un estado del pipeline.

namespace LeadFlow.Application.DTOs.LeadStatuses
{
    public class UpdateLeadStatusDefinitionRequest
    {
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? Color { get; set; }

        public int SortOrder { get; set; }

        public bool IsWon { get; set; }

        public bool IsLost { get; set; }

        public bool IsActive { get; set; } = true;
    }
}