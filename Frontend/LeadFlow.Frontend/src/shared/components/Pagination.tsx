type PaginationProps = {
  page: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, hasPreviousPage, hasNextPage, onPageChange }: PaginationProps) {
  // Si solo hay una página, no mostramos nada (así la página que lo use no necesita el "if").
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-500">
        Página {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}