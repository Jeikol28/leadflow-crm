//Este DTO representa los datos que el frontend enviará para editar un cliente.
namespace LeadFlow.Application.DTOs.Customers
{
    public class UpdateCustomerRequest
    {
        public string Name { get; set; } = string.Empty;

        public string? Email { get; set; }

        public string? Phone { get; set; }

        public string? Province { get; set; }

        public string? Canton { get; set; }

        public string? Address { get; set; }

        public string? Source { get; set; }

        public string Status { get; set; } = "Active";
    }
}