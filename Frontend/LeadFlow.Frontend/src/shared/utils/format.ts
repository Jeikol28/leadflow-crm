// Formateadores compartidos para moneda, fechas y tiempo relativo.

const numberFormatter = new Intl.NumberFormat('es-CR', {
  maximumFractionDigits: 0,
})

// Moneda compacta: "CRC 2.2M", "CRC 850K", "CRC 0".
export function formatCurrency(amount: number, currency = 'CRC'): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${currency} ${(amount / 1_000).toFixed(0)}K`
  return `${currency} ${numberFormatter.format(amount)}`
}

// Fecha corta legible: "07 jun". Devuelve "Sin fecha" si no hay valor.
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return 'Sin fecha'
  return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })
}

// Tiempo relativo simple a partir de un timestamp: "hace 3 min".
export function formatRelativeTime(timestamp: number): string {
  const diffSeconds = Math.floor((Date.now() - timestamp) / 1000)
  if (diffSeconds < 60) return 'hace un momento'
  const minutes = Math.floor(diffSeconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}
