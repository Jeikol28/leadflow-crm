namespace LeadFlow.Application.DTOs.Services
{
    public class CreateServiceRequest
    {
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public decimal Price { get; set; }
    }
}
