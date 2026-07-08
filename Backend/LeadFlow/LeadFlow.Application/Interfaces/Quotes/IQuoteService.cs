using LeadFlow.Application.DTOs.Common;
using LeadFlow.Application.DTOs.Quotes;

namespace LeadFlow.Application.Interfaces.Quotes
{
    public interface IQuoteService
    {
        Task<PagedResponse<QuoteResponse>> GetAllAsync(PagedRequest request);

        Task<QuoteResponse?> GetByIdAsync(int id);

        Task<QuoteResponse> CreateAsync(CreateQuoteRequest request);

        Task<QuoteResponse?> UpdateAsync(int id, UpdateQuoteRequest request);

        Task<QuoteResponse?> UpdateStatusAsync(int id, UpdateQuoteStatusRequest request);

        Task<bool> DeactivateAsync(int id);
    }
}
