"use client"

import { ReactNode } from "react"
import { useInView } from "@/hooks/useInView"

type Props = {
  children: ReactNode
  rootMargin?: string
  threshold?: number | number[]
}

export default function LazyMount({ children, rootMargin = "200px 0px", threshold = 0.01 }: Props) {
  const { ref, inView } = useInView({ rootMargin, threshold, once: true })
  return <div ref={ref as any}>{inView ? children : null}</div>
}

