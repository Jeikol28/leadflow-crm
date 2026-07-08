namespace LeadFlow.Application.DTOs.Common
{
    // Envuelve un listado paginado con metadatos utiles para tablas y pantallas del frontend.
    public class PagedResponse<T>
    {
        public List<T> Items { get; set; } = new();

        public int Page { get; set; }

        public int PageSize { get; set; }

        public int TotalItems { get; set; }

        public int TotalPages { get; set; }

        public bool HasPreviousPage { get; set; }

        public bool HasNextPage { get; set; }

        public static PagedResponse<T> Create(List<T> items, int totalItems, PagedRequest request)
        {
            var page = request.ValidPage;
            var pageSize = request.ValidPageSize;
            var totalPages = totalItems == 0
                ? 0
                : (int)Math.Ceiling((decimal)totalItems / pageSize);

            return new PagedResponse<T>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
                HasPreviousPage = page > 1,
                HasNextPage = totalPages > 0 && page < totalPages
            };
        }
    }
}
