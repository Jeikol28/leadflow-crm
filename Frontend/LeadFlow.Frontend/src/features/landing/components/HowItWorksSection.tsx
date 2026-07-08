import { UserPlus, GitPullRequestArrow, Sparkles } from 'lucide-react'
import { Reveal } from '../../../shared/components/motion/Reveal'

const STEPS = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Captura clientes y leads',
    description:
      'Registra prospectos con temperatura, valor estimado, responsable y fuente. Organiza tu pipeline desde el primer contacto.',
  },
  {
    number: '02',
    icon: GitPullRequestArrow,
    title: 'Gestiona el pipeline',
    description:
      'Sigue cada oportunidad por etapas, programa tareas, registra interacciones y recibe alertas cuando algo necesita atención.',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Cierra con IA y cotizaciones',
    description:
      'El asistente IA prioriza tus acciones. Genera cotizaciones profesionales con IVA 13%, PDF y estados de seguimiento.',
  },
]

export function HowItWorksSection() {
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-teal-600">
              Cómo funciona
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-balance text-4xl font-black tracking-[-0.03em] text-teal-950 lg:text-5xl">
              De prospecto a cliente en tres pasos claros.
            </h2>
          </div>
        </Reveal>

        <div className="relative mt-14 grid gap-8 md:grid-cols-3">
          {/* Connector line (desktop) */}
          <div
            aria-hidden
            className="absolute left-[calc(16.667%+1rem)] right-[calc(16.667%+1rem)] top-9 hidden h-px bg-gradient-to-r from-teal-200 via-teal-300 to-teal-200 md:block"
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <Reveal key={step.number} delay={i * 100}>
                <div className="group relative flex flex-col items-center text-center">
                  {/* Step circle */}
                  <div className="relative mb-6">
                    <div className="grid size-[4.5rem] place-items-center rounded-2xl border-2 border-teal-200 bg-white shadow-[0_8px_30px_rgba(15,118,110,0.1)] transition-all duration-300 group-hover:border-teal-400 group-hover:shadow-[0_12px_40px_rgba(15,118,110,0.18)]">
                      <Icon size={26} className="text-teal-700" />
                    </div>
                    <span className="absolute -right-1 -top-2 flex size-6 items-center justify-center rounded-full bg-teal-950 text-[10px] font-black text-cyan-200">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-teal-950">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{step.description}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
