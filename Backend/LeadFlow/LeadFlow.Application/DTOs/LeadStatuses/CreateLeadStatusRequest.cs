//Este DTO sirve para crear un nuevo estado del pipeline para una empresa.

namespace LeadFlow.Application.DTOs.LeadStatuses
{
    public class CreateLeadStatusRequest
    {
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? Color { get; set; }

        public int SortOrder { get; set; }

        public bool IsWon { get; set; }

        public bool IsLost { get; set; }
    }
}