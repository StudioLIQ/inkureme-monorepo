"use client"

import { CSSProperties, ReactNode } from "react"
import { useInView } from "@/hooks/useInView"
import { useReducedMotion } from "@/hooks/useReducedMotion"

type Direction = "up" | "down" | "left" | "right" | "fade"

type Props = {
  children: ReactNode
  as?: keyof JSX.IntrinsicElements
  className?: string
  delayMs?: number
  durationMs?: number
  from?: Direction
}

export function Reveal({
  children,
  as: Tag = "div",
  className,
  delayMs = 0,
  durationMs = 600,
  from = "up",
}: Props) {
  const reduced = useReducedMotion()
  const { ref, inView } = useInView({ threshold: 0.15, once: true })

  const initialTransforms: Record<Direction, string> = {
    up: "translate-y-4",
    down: "-translate-y-4",
    left: "translate-x-4",
    right: "-translate-x-4",
    fade: "",
  }

  const style: CSSProperties = reduced
    ? {}
    : {
        transitionDelay: delayMs ? `${delayMs}ms` : undefined,
        transitionDuration: `${durationMs}ms`,
      }

  return (
    <Tag
      ref={ref as any}
      style={style}
      className={[
        reduced ? "transition-none" : "transition-all ease-out",
        "will-change-transform will-change-opacity",
        !reduced && !inView ? ["opacity-0", initialTransforms[from]].join(" ") : "",
        (reduced || inView) ? "opacity-100 translate-x-0 translate-y-0" : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </Tag>
  )
}

export default Reveal
