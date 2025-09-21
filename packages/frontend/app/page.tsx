"use client"

import { MintMockUSDT } from '@/components/MintMockUSDT'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import Reveal from '@/components/Reveal'
import TiltCard from '@/components/TiltCard'
import CountUp from '@/components/CountUp'
import LazyMount from '@/components/LazyMount'
import dynamic from 'next/dynamic'

const HowItWorks = dynamic(() => import('@/components/home/HowItWorks'), {
  ssr: false,
  loading: () => (
    <section className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-busy>
        <div className="text-center mb-3 sm:mb-5">
          <div className="mx-auto h-5 sm:h-6 w-36 bg-gray-200 rounded mb-1.5 animate-pulse" />
          <div className="mx-auto h-3 sm:h-3.5 w-52 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid gap-2.5 sm:gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-3 animate-pulse">
              <div className="h-8 w-8 bg-primary-100 rounded-full mb-2.5" />
              <div className="h-3.5 w-28 bg-gray-200 rounded mb-1.5" />
              <div className="h-2.5 w-10/12 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
})
const Trust = dynamic(() => import('@/components/home/Trust'), {
  ssr: false,
  loading: () => (
    <section className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-busy>
        <div className="text-center mb-3 sm:mb-5">
          <div className="mx-auto h-5 sm:h-6 w-32 bg-gray-200 rounded mb-1.5 animate-pulse" />
          <div className="mx-auto h-3 sm:h-3.5 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid gap-2.5 sm:gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-3 animate-pulse">
              <div className="h-8 w-8 bg-primary-100 rounded-lg mb-2.5" />
              <div className="h-3.5 w-24 bg-gray-200 rounded mb-1.5" />
              <div className="h-2.5 w-9/12 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
})
const Stats = dynamic(() => import('@/components/home/Stats'), {
  ssr: false,
  loading: () => (
    <section className="py-8 sm:py-12 bg-gradient-to-b from-white to-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-busy>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5 text-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="mx-auto h-5 w-16 bg-gray-200 rounded mb-1" />
              <div className="h-2 w-14 bg-gray-100 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
})
const FeaturedPolicies = dynamic(() => import('@/components/home/FeaturedPolicies'), {
  ssr: false,
  loading: () => (
    <section className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-busy>
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
            <div className="h-5 w-40 bg-gray-200 rounded mb-1.5 animate-pulse" />
            <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-8 w-28 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-40 bg-gray-100 rounded mb-4" />
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="h-9 bg-gray-100 rounded" />
                <div className="h-9 bg-gray-100 rounded" />
              </div>
              <div className="h-9 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
})
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useState } from 'react'

export default function Home() {
  const { isConnected } = useAccount()
  const reduced = useReducedMotion()
  const [heroParallax, setHeroParallax] = useState<{x:number;y:number}>({ x: 0, y: 0 })

  function onHeroMove(e: React.MouseEvent<HTMLElement>) {
    if (reduced) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    // Responsive parallax strength based on width (approx Tailwind breakpoints)
    const w = rect.width
    const strength = w >= 1280 ? 22 : w >= 1024 ? 18 : w >= 640 ? 12 : 8
    setHeroParallax({
      x: (px - 0.5) * strength,
      y: (py - 0.5) * strength,
    })
  }

  function onHeroLeave() {
    if (reduced) return
    setHeroParallax({ x: 0, y: 0 })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section onMouseMove={onHeroMove} onMouseLeave={onHeroLeave} className="relative overflow-hidden pt-16 sm:pt-24 pb-16 sm:pb-24 lg:pb-28">
        {/* Background layers */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          {/* Base gradient */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-primary-50 to-white"
            style={reduced ? undefined : { transform: `translate3d(${heroParallax.x}px, ${heroParallax.y}px, 0)`, transition: 'transform 120ms ease-out' }}
          />
          {/* Soft gradient blobs */}
          <div
            aria-hidden
            className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary-200/50 blur-3xl mix-blend-multiply"
            style={reduced ? undefined : { transform: `translate3d(${heroParallax.x * 0.35}px, ${heroParallax.y * 0.35}px, 0)`, transition: 'transform 160ms ease-out' }}
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary-100/60 blur-3xl mix-blend-multiply"
            style={reduced ? undefined : { transform: `translate3d(${heroParallax.x * -0.25}px, ${heroParallax.y * -0.25}px, 0)`, transition: 'transform 160ms ease-out' }}
          />
          {/* Subtle grid pattern with fade */}
          <svg
            aria-hidden
            className="absolute inset-0 h-full w-full opacity-30 [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]"
          >
            <defs>
              <pattern id="hero-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" className="text-[--color-border]" />
          </svg>
          {/* Thematic illustration */}
          {/* Mobile: subtle, smaller, offset to avoid content overlap */}
          <img
            src="/hero-flight.svg"
            alt=""
            aria-hidden
            className="block md:hidden absolute -right-24 -top-6 w-[320px] max-w-none opacity-25"
            style={reduced ? undefined : { transform: `translate3d(${heroParallax.x * 0.18}px, ${heroParallax.y * 0.18}px, 0)`, transition: 'transform 200ms ease-out' }}
          />
          {/* Desktop: larger, more visible */}
          <img
            src="/hero-flight.svg"
            alt=""
            aria-hidden
            className="hidden md:block absolute right-[-3rem] lg:right-[-6rem] top-10 lg:top-16 w-[480px] lg:w-[560px] max-w-none opacity-85 drop-shadow-xl"
            style={reduced ? undefined : { transform: `translate3d(${heroParallax.x * 0.25}px, ${heroParallax.y * 0.25}px, 0)`, transition: 'transform 180ms ease-out' }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7">
              <Reveal as="h1" durationMs={550} className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                Protect Your Journey
                <span className="block text-primary">With Smart Flight Insurance</span>
              </Reveal>
              <Reveal delayMs={80} durationMs={550} className="mt-4 text-base sm:text-lg text-muted max-w-2xl">
                Get automatic compensation when your flight is delayed. Fair, transparent, and powered by blockchain technology.
              </Reveal>
              <Reveal delayMs={160} durationMs={550} className="mt-6">
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <Link href="/policies" className="w-full sm:w-auto px-5 py-3 rounded-full bg-primary text-white font-semibold shadow-sm hover:opacity-90 transition-all hover:shadow-md active:scale-[0.98] text-center">
                    Browse Available Coverage
                  </Link>
                  <Link href="/create" className="w-full sm:w-auto px-5 py-3 rounded-full border border-[--color-border] text-foreground font-semibold hover:bg-gray-50 transition-all active:scale-[0.98] text-center">
                    Become a Provider
                  </Link>
                </div>
              </Reveal>
            </div>
            <div className="md:col-span-5">
              {isConnected ? (
                <MintMockUSDT />
              ) : (
                <Reveal delayMs={150}>
                  <div className="card p-4 sm:p-6">
                    <div className="mb-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Testnet Demo
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">Start Your Trial</h3>
                    <p className="text-sm text-muted mb-4">Get free test tokens to explore the platform risk-free.</p>
                    <div className="rounded-lg border border-dashed border-[--color-border] p-4 sm:p-6 text-center text-sm text-muted">
                      Connect your wallet to receive test tokens instantly
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[--color-border] my-6 sm:my-8 lg:my-10" />

      {/* How it works (code-split) */}
      <LazyMount>
        <HowItWorks />
      </LazyMount>

      {/* Divider */}
      <div className="border-t border-[--color-border] my-6 sm:my-8 lg:my-10" />

      {/* Featured Policies */}
      <LazyMount>
        <FeaturedPolicies />
      </LazyMount>

      {/* Trust & Transparency (code-split) */}
      <LazyMount>
        <Trust />
      </LazyMount>

      {/* Stats Section (code-split) */}
      <LazyMount>
        <Stats />
      </LazyMount>
    </div>
  )
}
