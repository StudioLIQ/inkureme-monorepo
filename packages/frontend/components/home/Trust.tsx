"use client"

import Reveal from "@/components/Reveal"
import TiltCard from "@/components/TiltCard"

export default function TrustSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <Reveal as="h2" durationMs={500} className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Built on Trust</Reveal>
          <Reveal delayMs={80} durationMs={500} className="text-sm sm:text-base text-muted max-w-2xl mx-auto">Your protection is secured by smart contracts and verified data</Reveal>
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <Reveal durationMs={500}>
            <TiltCard>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl mb-4">🔒</div>
              <h3 className="font-semibold mb-2 text-lg">Secure & Audited</h3>
              <p className="text-sm text-muted leading-relaxed">Smart contracts built with industry-standard security practices and open-source libraries.</p>
              <div className="mt-4 inline-flex items-center text-xs text-primary font-medium">Learn more →</div>
            </TiltCard>
          </Reveal>
          <Reveal delayMs={80} durationMs={500}>
            <TiltCard>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl mb-4">📊</div>
              <h3 className="font-semibold mb-2 text-lg">Fully Transparent</h3>
              <p className="text-sm text-muted leading-relaxed">All transactions are visible on the blockchain - track every policy and payout in real-time.</p>
              <div className="mt-4 inline-flex items-center text-xs text-primary font-medium">View on explorer →</div>
            </TiltCard>
          </Reveal>
          <Reveal delayMs={160} durationMs={500}>
            <TiltCard>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl mb-4">✅</div>
              <h3 className="font-semibold mb-2 text-lg">Verified Data</h3>
              <p className="text-sm text-muted leading-relaxed">Flight status verified by independent oracles ensuring fair and accurate claim settlements.</p>
              <div className="mt-4 inline-flex items-center text-xs text-primary font-medium">How it works →</div>
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

