// Página temporal reutilizable para módulos que aún no se han construido.

type PlaceholderPageProps = {
  title: string
  description?: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.1em] text-teal-600">LeadFlow</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">{title}</h1>
      </div>

      <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-20 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-teal-50 text-sm font-black text-teal-700">
          LF
        </span>
        <h2 className="mt-4 text-lg font-black text-teal-950">Módulo en construcción</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          {description ?? `La sección de ${title.toLowerCase()} estará disponible pronto.`}
        </p>
      </div>
    </div>
  )
}