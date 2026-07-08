namespace LeadFlow.Application.DTOs.AI
{
    // Solicitud del usuario para consultar al asistente comercial de IA.
    public class AiChatRequest
    {
        public string Question { get; set; } = string.Empty;
    }
}
