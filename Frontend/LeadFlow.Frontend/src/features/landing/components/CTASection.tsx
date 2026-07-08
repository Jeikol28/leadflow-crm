import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Reveal } from '../../../shared/components/motion/Reveal'

export function CTASection() {
  return (
    <section className="px-5 pb-12 pt-16 lg:px-8">
      <Reveal>
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-teal-950 px-6 py-14 text-center shadow-[0_32px_80px_rgba(4,47,46,0.28)] lg:px-12 lg:py-20">
          {/* Decorative blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 size-64 rounded-full bg-teal-800/40 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-24 size-64 rounded-full bg-cyan-800/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-teal-400/30 to-transparent"
          />

          <div className="relative">
            {/* Icon */}
            <div className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl bg-white/10 text-cyan-300">
              <Sparkles size={26} aria-hidden />
            </div>

            <h2 className="mx-auto max-w-3xl text-balance text-4xl font-black tracking-[-0.03em] text-white lg:text-5xl">
              Convierte cada oportunidad en una acción clara y cada seguimiento en una venta posible.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-teal-100/70">
              LeadFlow ayuda a tu equipo a priorizar clientes, dar seguimiento a tiempo y
              cerrar más ventas con IA, cotizaciones y reportes en un solo lugar.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-white px-7 text-[15px] font-bold shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition-all duration-200 hover:bg-cyan-50"
                  style={{ color: '#042f2e' }}
                >
                  Empezar a vender mejor
                  <ArrowRight size={17} aria-hidden />
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                <a
                  href="#producto"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-white/10"
                >
                  Ver demostración
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
