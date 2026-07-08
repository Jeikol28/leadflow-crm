import { Link } from '@tanstack/react-router'

const NAV_LINKS = [
  { label: 'Producto', href: '#producto' },
  { label: 'IA',       href: '#ia'       },
  { label: 'Cotizaciones', href: '#cotizaciones' },
  { label: 'Reportes',    href: '#reportes'     },
]

const LEGAL_LINKS = [
  { label: 'Términos de servicio', href: '#' },
  { label: 'Privacidad',           href: '#' },
  { label: 'Contacto',             href: '#' },
]

export function Footer() {
  return (
    <footer className="border-t border-teal-950/8 bg-white px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5" aria-label="LeadFlow — inicio">
              <span className="grid size-8 place-items-center rounded-lg bg-teal-950 text-[11px] font-black text-cyan-300">
                LF
              </span>
              <span className="text-[15px] font-black tracking-[-0.025em] text-teal-950">
                LeadFlow
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-500">
              CRM SaaS multiempresa para gestionar clientes, leads, pipeline, cotizaciones
              y reportes — con asistente IA integrado.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
              Plataforma
            </p>
            <ul className="mt-4 space-y-3" role="list">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm font-medium text-slate-600 transition-colors duration-150 hover:text-teal-900"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + CTA */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
              Legal
            </p>
            <ul className="mt-4 space-y-3" role="list">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm font-medium text-slate-600 transition-colors duration-150 hover:text-teal-900"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link
                to="/login"
                className="inline-flex h-9 items-center rounded-lg bg-teal-950 px-4 text-sm font-bold shadow-sm transition-all duration-150 hover:bg-teal-800"
                style={{ color: 'white' }}
              >
                Probar gratis
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-[13px] text-slate-400">
            © {new Date().getFullYear()} LeadFlow CRM. Todos los derechos reservados.
          </p>
          <p className="text-[13px] text-slate-400">
            Hecho para equipos de ventas en Costa Rica
          </p>
        </div>
      </div>
    </footer>
  )
}
