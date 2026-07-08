import { useNavigate } from '@tanstack/react-router'
import { useRecentQuotes } from '../useRecentQuotes'
import type { DashboardQuote } from '../quotes.types'
import { formatCurrency, formatShortDate } from '../../../shared/utils/format'

// Mapea el estado de la cotización (texto del backend) a estilos de badge.
function statusStyle(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case 'Borrador':
      return { label: 'Borrador', bg: 'bg-slate-100', text: 'text-slate-600' }
    case 'Enviada':
      return { label: 'Enviada', bg: 'bg-sky-100', text: 'text-sky-700' }
    case 'Aceptada':
      return { label: 'Aceptada', bg: 'bg-emerald-100', text: 'text-emerald-700' }
    case 'Rechazada':
      return { label: 'Rechazada', bg: 'bg-red-100', text: 'text-red-700' }
    default:
      return { label: status, bg: 'bg-slate-100', text: 'text-slate-600' }
  }
}

function QuoteRow({ quote, idx }: { quote: DashboardQuote; idx: number }) {
  const status = statusStyle(quote.status)

  return (
    <tr
      className={`border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/60 ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}
    >
      <td className="px-6 py-3.5">
        <span className="font-mono text-[12px] font-bold text-teal-700">{quote.quoteNumber}</span>
      </td>
      <td className="px-6 py-3.5 text-sm font-semibold text-slate-800">{quote.customerName}</td>
      <td className="px-6 py-3.5 text-right text-sm font-black text-slate-900">
        {formatCurrency(quote.total, quote.currency)}
      </td>
      <td className="px-6 py-3.5">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </td>
      <td className="px-6 py-3.5 text-right text-sm text-slate-500">{formatShortDate(quote.issueDate)}</td>
    </tr>
  )
}

export function QuotesTable() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useRecentQuotes()
  const quotes = data?.items ?? []

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-base font-black text-teal-950">Cotizaciones recientes</h2>
          <p className="mt-0.5 text-sm text-slate-500">Últimas propuestas del período</p>
        </div>
        <button
          onClick={() => navigate({ to: '/app/quotes' })}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-900"
        >
          Ver todas
        </button>
      </div>

      {error && <p className="px-6 py-6 text-sm font-semibold text-rose-600">{error}</p>}

      {!error && (
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Cotizaciones recientes">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Código</th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Cliente</th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Monto</th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Estado</th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                    Cargando cotizaciones...
                  </td>
                </tr>
              )}
              {!isLoading && quotes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    Aún no hay cotizaciones registradas.
                  </td>
                </tr>
              )}
              {quotes.map((quote, idx) => (
                <QuoteRow key={quote.id} quote={quote} idx={idx} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
