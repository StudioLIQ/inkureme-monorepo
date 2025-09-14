"use client"

import { HTMLAttributes, useRef, useState } from "react"
import { useReducedMotion } from "@/hooks/useReducedMotion"

type Props = HTMLAttributes<HTMLDivElement> & {
  maxTilt?: number // degrees
  scale?: number
}

export function TiltCard({
  className,
  maxTilt = 6,
  scale = 1.01,
  onMouseMove,
  onMouseLeave,
  ...props
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const reduced = useReducedMotion()

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    onMouseMove?.(e)
    if (reduced) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width // 0..1
    const py = (e.clientY - rect.top) / rect.height // 0..1

    const rx = (py - 0.5) * -2 * maxTilt
    const ry = (px - 0.5) * 2 * maxTilt

    setStyle({
      transform: `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${scale})`,
    })
  }

  function handleLeave(e: React.MouseEvent<HTMLDivElement>) {
    onMouseLeave?.(e)
    setStyle({ transform: "rotateX(0deg) rotateY(0deg) scale(1)" })
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={[
        "card p-4 sm:p-6",
        reduced ? "transition-none" : "transition-transform duration-200 ease-out",
        "[transform-style:preserve-3d]",
        "hover:shadow-lg",
        className,
      ].filter(Boolean).join(" ")}
      style={reduced ? undefined : style}
      {...props}
    />
  )
}

export default TiltCard
