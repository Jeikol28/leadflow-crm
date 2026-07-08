namespace LeadFlow.Api.Models
{
    // Representa una respuesta de error uniforme para la API.
    public class ApiErrorResponse
    {
        public int StatusCode { get; set; }

        public string Message { get; set; } = string.Empty;

        public string TraceId { get; set; } = string.Empty;
    }
}
