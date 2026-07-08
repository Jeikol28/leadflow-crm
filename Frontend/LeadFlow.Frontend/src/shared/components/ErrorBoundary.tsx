import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  // Cuando un hijo lanza un error en el render, React llama a esto.
  // Lo que devolvemos se mezcla con el estado → mostramos la UI de error.
  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  // Aquí se registra el error. Hoy a la consola; en producción iría a un
  // servicio de monitoreo (Sentry) para enterarnos de fallos reales.
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, info)
  }

  handleGoHome = () => {
    // Navega al inicio y reinicia el estado de la app.
    window.location.assign('/app')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-dvh place-items-center bg-[#f6fbf8] p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-rose-50 text-xl font-black text-rose-600">
              !
            </span>
            <h1 className="mt-4 text-lg font-black text-teal-950">Algo salió mal</h1>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Ocurrió un error inesperado. Puedes volver al inicio para continuar; si el problema
              persiste, contacta a soporte.
            </p>
            <button
              onClick={this.handleGoHome}
              className="mt-5 h-10 rounded-xl bg-teal-950 px-5 text-sm font-black text-white transition-colors hover:bg-teal-800"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )
    }

    // Si no hubo error, renderiza la app normal.
    return this.props.children
  }
}