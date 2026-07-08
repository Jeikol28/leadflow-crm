import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Producto', href: '#producto' },
  { label: 'IA', href: '#ia' },
  { label: 'Cotizaciones', href: '#cotizaciones' },
  { label: 'Reportes', href: '#reportes' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <header
        className={[
          'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-teal-950/8 bg-white/95 shadow-[0_1px_20px_rgba(4,47,46,0.07)] backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        ].join(' ')}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5" aria-label="LeadFlow — inicio">
            <span className="grid size-8 place-items-center rounded-lg bg-teal-950 text-[11px] font-black text-cyan-300 shadow-[0_6px_20px_rgba(4,47,46,0.22)]">
              LF
            </span>
            <span className="text-[15px] font-black tracking-[-0.025em] text-teal-950">
              LeadFlow
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-semibold text-slate-500 transition-colors duration-150 hover:text-teal-900"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 transition-colors duration-150 hover:text-teal-900"
            >
              Ingresar
            </Link>
            <Link
              to="/login"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal-950 px-4 text-sm font-bold shadow-[0_4px_14px_rgba(4,47,46,0.22)] transition-all duration-150 hover:-translate-y-px hover:bg-teal-800 hover:shadow-[0_6px_20px_rgba(4,47,46,0.3)] active:scale-[0.98]"
              style={{ color: 'white' }}
            >
              Probar gratis
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-lg text-teal-950 transition-colors hover:bg-teal-50 md:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-0 top-16 z-40 border-b border-teal-950/8 bg-white/98 px-5 pb-6 pt-4 shadow-[0_12px_40px_rgba(4,47,46,0.1)] backdrop-blur-xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <nav className="flex flex-col gap-1" aria-label="Navegación móvil">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-900"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Ingresar
              </Link>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-teal-950 px-4 py-3 text-center text-sm font-bold transition-opacity hover:opacity-90"
                style={{ color: 'white' }}
              >
                Probar gratis
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
