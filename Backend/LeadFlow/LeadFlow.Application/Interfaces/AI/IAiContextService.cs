using LeadFlow.Application.DTOs.AI;

namespace LeadFlow.Application.Interfaces.AI
{
    // Define el contexto seguro que se entregara a futuras funciones de inteligencia artificial.
    public interface IAiContextService
    {
        Task<AiContextResponse> GetContextAsync();
    }
}