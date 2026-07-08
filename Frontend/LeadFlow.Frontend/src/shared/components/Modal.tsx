import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  maxWidth?: string // ej. 'max-w-lg', 'max-w-2xl'
}

const FOCUSABLE = 'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'

export function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Recordamos qué tenía el foco para devolvérselo al cerrar.
    const previouslyFocused = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current

    // Al abrir, enfocamos el primer elemento enfocable del diálogo.
    dialog?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      // Trampa de foco: Tab/Shift+Tab giran dentro del diálogo (no se escapan al fondo).
      if (event.key !== 'Tab' || !dialog) return
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl`}
      >
        <h2 className="text-lg font-black text-teal-950">{title}</h2>
        {children}
      </div>
    </div>
  )
}
