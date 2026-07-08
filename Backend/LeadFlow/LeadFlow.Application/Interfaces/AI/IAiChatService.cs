using LeadFlow.Application.DTOs.AI;
using LeadFlow.Application.DTOs.Common;

namespace LeadFlow.Application.Interfaces.AI
{
    // Define el asistente comercial basado en contexto seguro del CRM.
    public interface IAiChatService
    {
        Task<AiChatResponse> ChatAsync(AiChatRequest request);

        Task<PagedResponse<AiChatLogResponse>> GetHistoryAsync(DateTime? from, DateTime? to, PagedRequest request);
    }
}
