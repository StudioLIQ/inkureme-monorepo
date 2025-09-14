"use client"

import Reveal from "@/components/Reveal"
import TiltCard from "@/components/TiltCard"

export default function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-24 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <Reveal as="h2" durationMs={500} className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Simple as 1-2-3</Reveal>
          <Reveal delayMs={80} durationMs={500} className="text-sm sm:text-base text-muted max-w-2xl mx-auto">Get covered in minutes with our streamlined process</Reveal>
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <Reveal durationMs={500}>
            <TiltCard className="cursor-pointer group">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary font-bold mb-4 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="font-semibold mb-2 text-lg">Select Coverage</h3>
              <p className="text-sm text-muted leading-relaxed">Browse available policies for your flight route and choose your coverage level.</p>
            </TiltCard>
          </Reveal>
          <Reveal delayMs={80} durationMs={500}>
            <TiltCard className="cursor-pointer group">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary font-bold mb-4 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="font-semibold mb-2 text-lg">Quick Purchase</h3>
              <p className="text-sm text-muted leading-relaxed">Complete your purchase in seconds with instant blockchain confirmation.</p>
            </TiltCard>
          </Reveal>
          <Reveal delayMs={160} durationMs={500}>
            <TiltCard className="cursor-pointer group">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary font-bold mb-4 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="font-semibold mb-2 text-lg">Automatic Payout</h3>
              <p className="text-sm text-muted leading-relaxed">Receive compensation automatically if your flight is delayed - no paperwork needed.</p>
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

