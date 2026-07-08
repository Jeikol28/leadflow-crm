// Loader de puntos animados (estilo Uiverse). Reutilizable en toda la app.
export function Loader({ label, className = '' }: { label?: string; className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="typing-indicator" aria-hidden="true">
        <div className="typing-circle"></div>
        <div className="typing-circle"></div>
        <div className="typing-circle"></div>
        <div className="typing-shadow"></div>
        <div className="typing-shadow"></div>
        <div className="typing-shadow"></div>
      </div>
      {label ? (
        <span className="text-sm text-slate-400">{label}</span>
      ) : (
        <span className="sr-only">Cargando</span>
      )}
    </div>
  )
}
