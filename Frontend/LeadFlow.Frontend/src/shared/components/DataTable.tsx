import type { ReactNode } from 'react'
import { Loader } from './Loader'

// Definición de una columna: su título y cómo dibujar la celda de cada fila.
export type Column<T> = {
  header: string
  align?: 'left' | 'right'
  cell: (item: T) => ReactNode
}

type DataTableProps<T> = {
  columns: Column<T>[]
  items: T[]
  getRowKey: (item: T) => string | number
  isLoading?: boolean
  error?: string | null
  emptyMessage?: string
}

// <T> es un "tipo genérico": un comodín para "el tipo de fila que muestre esta tabla"
// (Customer, Lead, Quote…). Así el MISMO componente sirve para cualquier entidad,
// y dentro de cada `cell` el `item` viene tipado correctamente. Type-safe y reutilizable.
export function DataTable<T>({
  columns,
  items,
  getRowKey,
  isLoading = false,
  error = null,
  emptyMessage = 'Sin registros.',
}: DataTableProps<T>) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
      {error ? (
        <div className="px-5 py-16 text-center">
          <p className="text-sm font-semibold text-rose-600">{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {columns.map((column) => (
                  <th
                    key={column.header}
                    className={`px-5 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ${
                      column.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-16">
                    <Loader />
                  </td>
                </tr>
              )}
              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-16 text-center text-sm text-slate-500">
                    {emptyMessage}
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={getRowKey(item)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  {columns.map((column) => (
                    <td
                      key={column.header}
                      className={`px-5 py-3.5 ${column.align === 'right' ? 'text-right' : ''}`}
                    >
                      {column.cell(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}