"use client"

import { useEffect, useRef, useState } from "react"
import { useInView } from "@/hooks/useInView"
import { useReducedMotion } from "@/hooks/useReducedMotion"

type Props = {
  to: number
  from?: number
  durationMs?: number
  suffix?: string
  className?: string
  format?: (value: number) => string
}

export function CountUp({ to, from = 0, durationMs = 1200, suffix = "", className, format }: Props) {
  const { ref, inView } = useInView({ threshold: 0.2, once: true })
  const reduced = useReducedMotion()
  const startTs = useRef<number | null>(null)
  const [val, setVal] = useState(from)

  useEffect(() => {
    if (!inView) return

    if (reduced) {
      setVal(to)
      return
    }

    let raf = 0
    const start = performance.now()
    startTs.current = start

    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3)

    const tick = (t: number) => {
      const elapsed = t - start
      const p = Math.min(1, elapsed / durationMs)
      const eased = easeOutCubic(p)
      const current = from + (to - from) * eased
      setVal(current)
      if (p < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, from, durationMs, reduced])

  return (
    <span ref={ref as any} className={className}>
      {format ? format(val) : `${Math.round(val).toLocaleString('en-US')}${suffix}`}
    </span>
  )
}

export default CountUp
