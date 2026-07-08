import { useEffect, useRef, useState } from 'react'
import { Bot, Check, Sparkles } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { Reveal } from '../../../shared/components/motion/Reveal'

const AI_QUESTIONS = [
  '¿Qué oportunidades debo atender primero?',
  '¿Qué tareas vencidas están afectando ventas?',
  '¿Qué cotizaciones necesitan seguimiento urgente?',
]

const AI_RESPONSE =
  'La oportunidad más prioritaria es "Implementación de automatización comercial". Temperatura caliente, score 70, probabilidad 75% y monto estimado de CRC 2.2M. Hay una cotización abierta vinculada — conviene enviar seguimiento hoy.'

function TypewriterText({ text, trigger }: { text: string; trigger: boolean }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    if (!trigger) return
    setDisplayed('')
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(interval)
    }, 22)
    return () => clearInterval(interval)
  }, [trigger, text])

  if (displayed.length === 0) {
    return (
      <span className="flex items-center gap-1.5" aria-label="Escribiendo...">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-teal-400"
            style={{ animation: `blink 1.2s ${i * 0.2}s ease-in-out infinite` }}
            aria-hidden
          />
        ))}
      </span>
    )
  }

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="cursor-blink ml-px inline-block w-0.5 bg-teal-600 align-middle" aria-hidden />
      )}
    </span>
  )
}

export function AISection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section id="ia" className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          {/* Left — dark card */}
          <Reveal direction="right">
            <div className="rounded-4xl bg-teal-950 p-8 text-white shadow-[0_32px_80px_rgba(4,47,46,0.3)] lg:p-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-semibold text-cyan-200">
                <Sparkles size={14} />
                IA orientada a ventas
              </span>

              <h2 className="mt-6 text-balance text-4xl font-black tracking-[-0.03em] lg:text-5xl">
                No solo responde.{' '}
                <span className="bg-linear-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  Prioriza el trabajo
                </span>{' '}
                comercial.
              </h2>

              <p className="mt-5 text-base leading-8 text-teal-100/70">
                El asistente analiza leads, tareas, cotizaciones, interacciones y alertas
                para proponer acciones concretas según el estado real de la empresa.
              </p>

              <ul className="mt-8 space-y-3" role="list">
                {AI_QUESTIONS.map((q) => (
                  <li
                    key={q}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <Check size={16} className="shrink-0 text-cyan-300" aria-hidden />
                    <span className="text-sm font-medium text-white/90">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Right — AI response card */}
          <Reveal delay={130} direction="left">
            <div
              ref={ref}
              className="rounded-4xl border border-teal-950/8 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
            >
              <div className="rounded-3xl bg-[#f0faf6] p-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.span
                      animate={inView ? { scale: [1, 1.08, 1] } : {}}
                      transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
                      className="grid size-10 place-items-center rounded-2xl bg-teal-950 text-cyan-300"
                      aria-hidden
                    >
                      <Bot size={20} />
                    </motion.span>
                    <div>
                      <p className="text-sm font-black text-teal-950">Respuesta generada</p>
                      <p className="text-xs text-slate-500">Basada en datos reales</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
                    Inteligente
                  </span>
                </div>

                {/* Typing indicator → text */}
                <div className="mt-5 min-h-25 rounded-2xl bg-white p-5">
                  <p className="text-sm leading-7 text-slate-700">
                    <TypewriterText text={AI_RESPONSE} trigger={inView} />
                  </p>
                </div>

                {/* Meta */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[11px] font-semibold text-slate-400">Relacionado</p>
                    <p className="mt-1 text-sm font-black text-teal-950">Lead: 6 · Quote: 2</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[11px] font-semibold text-slate-400">Acción sugerida</p>
                    <p className="mt-1 text-sm font-black text-teal-950">Llamar y registrar</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
