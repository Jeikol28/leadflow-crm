import { useMemo, useState } from 'react'
import { useQuotes } from './useQuotes'
import { useDeleteQuote, useSendQuoteEmail, useUpdateQuoteStatus } from './quoteMutations'
import { downloadQuotePdf } from './quotesService'
import { QuoteFormModal } from './QuoteFormModal'
import { DataTable } from '../../shared/components/DataTable'
import type { Column } from '../../shared/components/DataTable'
import { Pagination } from '../../shared/components/Pagination'
import { formatShortDate } from '../../shared/utils/format'
import { useToast } from '../../shared/toast/useToast'
import { useConfirm } from '../../shared/confirm/useConfirm'
import type { Quote } from './quotes.types'

const PAGE_SIZE = 10

function money(amount: number, currency: string): string {
  return `${currency} ${new Intl.NumberFormat('es-CR', { maximumFractionDigits: 2 }).format(amount)}`
}

function statusStyle(status: string): { bg: string; text: string } {
  switch (status) {
    case 'Borrador':
      return { bg: 'bg-slate-100', text: 'text-slate-600' }
    case 'Enviada':
      return { bg: 'bg-sky-100', text: 'text-sky-700' }
    case 'Aceptada':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700' }
    case 'Rechazada':
      return { bg: 'bg-red-100', text: 'text-red-700' }
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600' }
  }
}

const actionClass =
  'rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-900 disabled:opacity-60'

const acceptClass =
  'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60'

const rejectClass =
  'rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60'

// Devuelve las acciones de estado disponibles según el estado actual de la cotización.
type StatusAction = { label: string; status: string; tone: 'accept' | 'reject' | 'neutral' }

function nextStatusActions(status: string): StatusAction[] {
  switch (status) {
    case 'Borrador':
    case 'Enviada':
      return [
        { label: 'Aceptar', status: 'Aceptada', tone: 'accept' },
        { label: 'Rechazar', status: 'Rechazada', tone: 'reject' },
      ]
    case 'Aceptada':
    case 'Rechazada':
      return [{ label: 'Reabrir', status: 'Borrador', tone: 'neutral' }]
    default:
      return []
  }
}

export function QuotesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const { data, isLoading, isFetching, error } = useQuotes(page, PAGE_SIZE)
  const deleteQuote = useDeleteQuote()
  const sendEmail = useSendQuoteEmail()
  const updateStatus = useUpdateQuoteStatus()
  const { showToast } = useToast()
  const confirm = useConfirm()

  const sendingId = sendEmail.isPending ? sendEmail.variables ?? null : null
  const updatingStatusId = updateStatus.isPending ? updateStatus.variables?.id ?? null : null

  const items = data?.items ?? []
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((quote) =>
      [quote.quoteNumber, quote.customerName, quote.status].some((field) => field?.toLowerCase().includes(term)),
    )
  }, [items, search])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(quote: Quote) {
    setEditing(quote)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleDelete(quote: Quote) {
    const ok = await confirm({
      title: 'Eliminar cotización',
      message: `¿Seguro que deseas eliminar la cotización ${quote.quoteNumber}?`,
      confirmText: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    deleteQuote.mutate(quote.id, {
      onSuccess: () => showToast('Cotización eliminada.', 'success'),
      onError: () => showToast('No pudimos eliminar la cotización.', 'error'),
    })
  }

  async function handlePdf(quote: Quote) {
    setDownloadingId(quote.id)
    try {
      await downloadQuotePdf(quote.id, quote.quoteNumber)
      showToast('PDF descargado.', 'success')
    } catch {
      showToast('No pudimos generar el PDF de la cotización.', 'error')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleStatus(quote: Quote, action: StatusAction) {
    const ok = await confirm({
      title: `${action.label} cotización`,
      message:
        action.status === 'Aceptada'
          ? `¿Marcar la cotización ${quote.quoteNumber} como Aceptada? Esto también marcará su oportunidad como Ganada.`
          : action.status === 'Rechazada'
            ? `¿Marcar la cotización ${quote.quoteNumber} como Rechazada? Esto marcará su oportunidad como Perdida.`
            : `¿Reabrir la cotización ${quote.quoteNumber} y volverla a Borrador?`,
      confirmText: action.label,
      danger: action.tone === 'reject',
    })
    if (!ok) return
    updateStatus.mutate(
      { id: quote.id, status: action.status },
      {
        onSuccess: () => showToast(`Cotización ${quote.quoteNumber}: ${action.status}.`, 'success'),
        onError: () => showToast('No pudimos actualizar el estado de la cotización.', 'error'),
      },
    )
  }

  async function handleEmail(quote: Quote) {
    const ok = await confirm({
      title: 'Enviar cotización',
      message: `¿Enviar la cotización ${quote.quoteNumber} al correo del cliente?`,
      confirmText: 'Enviar',
    })
    if (!ok) return
    sendEmail.mutate(quote.id, {
      onSuccess: (result) => showToast(result.message || `Cotización ${quote.quoteNumber} enviada.`, 'success'),
      onError: () => showToast('No pudimos enviar la cotización por correo.', 'error'),
    })
  }

  const columns: Column<Quote>[] = [
    {
      header: 'Número',
      cell: (quote) => <span className="font-mono text-[12px] font-bold text-teal-700">{quote.quoteNumber}</span>,
    },
    { header: 'Cliente', cell: (quote) => <span className="text-sm font-semibold text-slate-800">{quote.customerName}</span> },
    {
      header: 'Estado',
      cell: (quote) => {
        const style = statusStyle(quote.status)
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${style.bg} ${style.text}`}>
            {quote.status}
          </span>
        )
      },
    },
    {
      header: 'Total',
      align: 'right',
      cell: (quote) => <span className="text-sm font-black text-slate-900">{money(quote.total, quote.currency)}</span>,
    },
    { header: 'Fecha', cell: (quote) => <span className="text-sm text-slate-500">{formatShortDate(quote.issueDate)}</span> },
    {
      header: 'Acciones',
      align: 'right',
      cell: (quote) => {
        const deleting = deleteQuote.isPending && deleteQuote.variables === quote.id
        const statusActions = nextStatusActions(quote.status)
        return (
          <span className="inline-flex flex-wrap items-center justify-end gap-2">
            {statusActions.map((action) => (
              <button
                key={action.status}
                onClick={() => handleStatus(quote, action)}
                disabled={updatingStatusId === quote.id}
                className={
                  action.tone === 'accept' ? acceptClass : action.tone === 'reject' ? rejectClass : actionClass
                }
              >
                {updatingStatusId === quote.id ? '...' : action.label}
              </button>
            ))}
            <button onClick={() => openEdit(quote)} className={actionClass}>
              Editar
            </button>
            <button onClick={() => handlePdf(quote)} disabled={downloadingId === quote.id} className={actionClass}>
              {downloadingId === quote.id ? '...' : 'PDF'}
            </button>
            <button onClick={() => handleEmail(quote)} disabled={sendingId === quote.id} className={actionClass}>
              {sendingId === quote.id ? '...' : 'Correo'}
            </button>
            <button
              onClick={() => handleDelete(quote)}
              disabled={deleting}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            >
              {deleting ? '...' : 'Eliminar'}
            </button>
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-teal-600">Operaciones</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">Cotizaciones</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data ? `${data.totalItems} cotización${data.totalItems === 1 ? '' : 'es'} en total` : 'Cargando…'}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-10 rounded-xl bg-teal-950 px-4 text-sm font-black text-white shadow-[0_4px_14px_rgba(4,47,46,0.2)] transition-colors hover:bg-teal-800"
        >
          + Nueva cotización
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar en esta página…"
          className="h-10 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition-colors focus:border-teal-500"
          aria-label="Buscar cotizaciones"
        />
        {isFetching && <span className="text-xs text-slate-400">Actualizando…</span>}
      </div>

      {/* Tabla reutilizable */}
      <DataTable
        columns={columns}
        items={filtered}
        getRowKey={(quote) => quote.id}
        isLoading={isLoading}
        error={error}
        emptyMessage={search ? 'Ninguna cotización coincide con tu búsqueda.' : 'Aún no hay cotizaciones registradas.'}
      />

      {/* Paginación reutilizable */}
      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          hasPreviousPage={data.hasPreviousPage}
          hasNextPage={data.hasNextPage}
          onPageChange={setPage}
        />
      )}

      {/* Modal crear/editar */}
      {formOpen && <QuoteFormModal quote={editing} onClose={closeForm} />}
    </div>
  )
}