//Este DTO representa los datos que la API devolverá al frontend cuando consulte clientes.
namespace LeadFlow.Application.DTOs.Customers
{
    public class CustomerResponse
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Email { get; set; }

        public string? Phone { get; set; }

        public string? Province { get; set; }

        public string? Canton { get; set; }

        public string? Address { get; set; }

        public string? Source { get; set; }

        public string Status { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}