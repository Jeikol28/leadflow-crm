import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ConfirmContext } from './ConfirmContext'
import type { ConfirmOptions } from './ConfirmContext'

export function ConfirmProvider({ children }: { children: ReactNode }) {
  // Si hay opciones, el diálogo está abierto; si es null, está cerrado.
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  // Aquí guardamos el "resolve" de la promesa para llamarlo cuando el usuario decida.
  const resolverRef = useRef<((result: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  // Cierra el diálogo y resuelve la promesa con el resultado.
  function close(result: boolean) {
    resolverRef.current?.(result)
    resolverRef.current = null
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {options && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm" onClick={() => close(false)} aria-hidden />
          <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-black text-teal-950">{options.title}</h2>
            {options.message && <p className="mt-1.5 text-sm leading-6 text-slate-500">{options.message}</p>}
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => close(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                {options.cancelText ?? 'Cancelar'}
              </button>
              <button
                onClick={() => close(true)}
                className={`h-10 rounded-xl px-4 text-sm font-black text-white transition-colors ${
                  options.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-950 hover:bg-teal-800'
                }`}
              >
                {options.confirmText ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
