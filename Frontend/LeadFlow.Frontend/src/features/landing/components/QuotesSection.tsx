import { FileText } from 'lucide-react'
import { Reveal } from '../../../shared/components/motion/Reveal'

const QUOTE_ROWS = [
  { folio: 'STC-2026-0001', cliente: 'Distribuidora La Sabana', subtotal: 'CRC 500,000', iva: 'CRC 65,000', total: 'CRC 565,000', estado: 'Enviada',  estadoColor: 'bg-sky-100 text-sky-800'      },
  { folio: 'STC-2026-0002', cliente: 'Clínica Santa Vida',      subtotal: 'CRC 350,000', iva: 'CRC 45,500', total: 'CRC 395,500', estado: 'Aceptada', estadoColor: 'bg-emerald-100 text-emerald-800' },
  { folio: 'STC-2026-0003', cliente: 'NovaTech CR',             subtotal: 'CRC 900,000', iva: 'CRC 117,000', total: 'CRC 1,017,000', estado: 'Borrador', estadoColor: 'bg-slate-100 text-slate-700'   },
]

const TABLE_HEADERS = ['Folio', 'Cliente', 'Subtotal', 'IVA 13%', 'Total', 'Estado']

export function QuotesSection() {
  return (
    <section id="cotizaciones" className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.1em] text-teal-600">
                Cotizaciones listas para vender
              </p>
              <h2 className="mt-3 text-balance text-4xl font-black tracking-[-0.03em] text-teal-950 lg:text-5xl">
                Propuestas comerciales con impuestos, descuentos y PDF.
              </h2>
            </div>
            <p className="text-base leading-8 text-slate-500">
              LeadFlow genera cotizaciones con datos del cliente, oportunidad, servicios,
              términos comerciales, IVA 13% para Costa Rica y estados de seguimiento:
              borrador, enviada, aceptada o rechazada.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-teal-950/8 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            {/* Card header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-teal-950 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-cyan-300" aria-hidden>
                  <FileText size={17} />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-teal-300">Soluciones Ticas</p>
                  <h3 className="text-lg font-black text-white">Cotizaciones activas</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white">
                  IVA 13%
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white">
                  PDF listo
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead className="bg-[#f0faf6]">
                  <tr>
                    {TABLE_HEADERS.map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {QUOTE_ROWS.map((row) => (
                    <tr
                      key={row.folio}
                      className="transition-colors duration-150 hover:bg-teal-50/40"
                    >
                      <td className="px-6 py-4 text-sm font-black text-teal-950">{row.folio}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{row.cliente}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{row.subtotal}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{row.iva}</td>
                      <td className="px-6 py-4 text-sm font-black text-teal-950">{row.total}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${row.estadoColor}`}>
                          {row.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
