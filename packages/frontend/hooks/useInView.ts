"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type UseInViewOptions = {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
  once?: boolean
}

export function useInView<T extends Element = Element>({
  root = null,
  rootMargin = "0px",
  threshold = 0.1,
  once = true,
}: UseInViewOptions = {}) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  const setRef = useCallback((node: T | null) => {
    ref.current = node
  }, [])

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (typeof IntersectionObserver === "undefined") {
      // Fallback: show immediately
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.unobserve(entry.target)
        } else if (!once) {
          setInView(false)
        }
      },
      { root, rootMargin, threshold }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [root, rootMargin, threshold, once])

  return { ref: setRef, inView }
}

