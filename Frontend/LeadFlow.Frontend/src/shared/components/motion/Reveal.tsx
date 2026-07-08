import { type ReactNode } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  direction?: Direction
  amount?: number
  once?: boolean
}

const offsets: Record<Direction, { x?: number; y?: number }> = {
  up:    { y: 24 },
  down:  { y: -24 },
  left:  { x: 24 },
  right: { x: -24 },
  none:  {},
}

export function Reveal({
  children,
  className,
  delay = 0,
  direction = 'up',
  amount = 0.15,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const isInView = useInView(ref, { once, amount })

  const hidden = shouldReduceMotion ? {} : { opacity: 0, filter: 'blur(4px)', ...offsets[direction] }
  const visible = { opacity: 1, filter: 'blur(0px)', x: 0, y: 0 }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={hidden}
      animate={isInView ? visible : hidden}
      transition={{
        duration: 0.7,
        delay: delay / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
