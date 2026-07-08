//Este DTO se usará para cambiar solo el estado del lead.
//Esto será muy útil para el pipeline Kanban, cuando arrastre una tarjeta de una columna a otra.

namespace LeadFlow.Application.DTOs.Leads
{
    public class UpdateLeadStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}