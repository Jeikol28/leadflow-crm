import type { InputHTMLAttributes, ReactNode } from 'react'

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }

// Checkbox animado (estilo Uiverse). Envuelve un input real para conservar el
// comportamiento controlado y la accesibilidad (foco, teclado, aria).
export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`cl-checkbox ${className}`}>
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  )
}
