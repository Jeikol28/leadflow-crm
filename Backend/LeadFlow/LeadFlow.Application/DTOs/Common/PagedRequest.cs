using System.Text.Json.Serialization;

namespace LeadFlow.Application.DTOs.Common
{
    // Define los parametros basicos para consultar listados por paginas.
    public class PagedRequest
    {
        public int Page { get; set; } = 1;

        public int PageSize { get; set; } = 20;

        [JsonIgnore]
        public int ValidPage => Page < 1 ? 1 : Page;

        [JsonIgnore]
        public int ValidPageSize => PageSize switch
        {
            < 1 => 20,
            > 100 => 100,
            _ => PageSize
        };

        [JsonIgnore]
        public int Skip => (ValidPage - 1) * ValidPageSize;
    }
}
